import { useEffect, useMemo, useRef, useState } from "react";

export default function SetupScreen({
  onStart,
  isLoading,
  isLoadingSets,
  questionSets,
  onRefreshSets,
}) {
  const [settings, setSettings] = useState({
    submittedBy: "",
    setFile: "",
    numberOfQuestions: "10",
    timeMinutes: "60",
  });
  const [isSetMenuOpen, setIsSetMenuOpen] = useState(false);
  const [highlightedSetIndex, setHighlightedSetIndex] = useState(-1);
  const setMenuRef = useRef(null);
  const setTriggerRef = useRef(null);
  const setListRef = useRef(null);

  const selectedSetFile = settings.setFile || questionSets[0]?.file || "";

  const selectedSet = useMemo(
    () => questionSets.find((setItem) => setItem.file === selectedSetFile),
    [questionSets, selectedSetFile],
  );

  const selectedSetIndex = useMemo(
    () => questionSets.findIndex((setItem) => setItem.file === selectedSetFile),
    [questionSets, selectedSetFile],
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (setMenuRef.current && !setMenuRef.current.contains(event.target)) {
        setIsSetMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSetMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const fieldErrors = useMemo(() => {
    const errors = {
      set: "",
      questions: "",
      time: "",
    };

    const numberOfQuestions = Number(settings.numberOfQuestions);
    const timeMinutes = Number(settings.timeMinutes);
    const availableQuestions = selectedSet?.questionCount || 0;

    if (!selectedSetFile) {
      errors.set = "Select a valid question set.";
    }

    if (!Number.isInteger(numberOfQuestions) || numberOfQuestions < 1) {
      errors.questions = "Number of questions must be at least 1.";
    } else if (
      availableQuestions > 0 &&
      numberOfQuestions > availableQuestions
    ) {
      errors.questions = `Only ${availableQuestions} questions are available in this set.`;
    }

    if (!Number.isInteger(timeMinutes) || timeMinutes < 15) {
      errors.time = "Time must be at least 15 minutes.";
    } else if (timeMinutes > 720) {
      errors.time = "Time cannot exceed 720 minutes.";
    }

    return errors;
  }, [
    selectedSet,
    selectedSetFile,
    settings.numberOfQuestions,
    settings.timeMinutes,
  ]);

  const validationErrors = useMemo(
    () => Object.values(fieldErrors).filter(Boolean),
    [fieldErrors],
  );

  const canSubmit =
    !isLoading &&
    !isLoadingSets &&
    questionSets.length > 0 &&
    validationErrors.length === 0;

  const openSetMenu = () => {
    setIsSetMenuOpen(true);
    setHighlightedSetIndex(selectedSetIndex >= 0 ? selectedSetIndex : 0);
    // focus stays naturally on the trigger button — key handler below drives navigation
  };

  const closeSetMenu = () => {
    setIsSetMenuOpen(false);
    setHighlightedSetIndex(-1);
  };

  const handleSetSelect = (file) => {
    setSettings((prev) => ({ ...prev, setFile: file }));
    closeSetMenu();
    window.requestAnimationFrame(() => {
      setTriggerRef.current?.focus();
    });
  };

  const moveHighlightedSet = (direction) => {
    if (questionSets.length === 0) {
      return;
    }

    setHighlightedSetIndex((prev) => {
      const fallbackIndex = selectedSetIndex >= 0 ? selectedSetIndex : 0;
      const currentIndex = prev >= 0 ? prev : fallbackIndex;
      return Math.min(
        questionSets.length - 1,
        Math.max(0, currentIndex + direction),
      );
    });
  };

  const handleSetTriggerKeyDown = (event) => {
    if (isLoadingSets || questionSets.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isSetMenuOpen) {
        openSetMenu();
      } else {
        moveHighlightedSet(1);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isSetMenuOpen) {
        openSetMenu();
      } else {
        moveHighlightedSet(-1);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isSetMenuOpen) {
        openSetMenu();
      } else if (highlightedSetIndex >= 0) {
        handleSetSelect(questionSets[highlightedSetIndex].file);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSetMenu();
    }
  };

  const handleSetListKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlightedSet(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlightedSet(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (highlightedSetIndex >= 0) {
        handleSetSelect(questionSets[highlightedSetIndex].file);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSetMenu();
      window.requestAnimationFrame(() => {
        setTriggerRef.current?.focus();
      });
    }
  };

  const sanitizeWholeNumberInput = (rawValue) => {
    const digitsOnly = rawValue.replace(/[^\d]/g, "");
    if (digitsOnly === "") {
      return "";
    }

    return digitsOnly.replace(/^0+(?=\d)/, "");
  };

  const clampWholeNumberField = (field, { min, max, fallback }) => {
    const current = Number(settings[field]);
    if (!Number.isInteger(current)) {
      setSettings((prev) => ({ ...prev, [field]: String(fallback) }));
      return;
    }

    const clamped = Math.min(max, Math.max(min, current));
    setSettings((prev) => ({ ...prev, [field]: String(clamped) }));
  };

  const handleNumberKeyDown = (event, field, { min, max, step }) => {
    if (["e", "E", "+", "-", "."].includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowUp" ? 1 : -1;
    const current = Number(settings[field]);
    const safeCurrent = Number.isFinite(current) ? current : min;
    const next = Math.min(max, Math.max(min, safeCurrent + direction * step));

    setSettings((prev) => ({
      ...prev,
      [field]: String(next),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    onStart({
      submittedBy: settings.submittedBy.trim() || "Anonymous",
      setFile: selectedSetFile,
      setLabel: selectedSet?.label || "Question Set",
      numberOfQuestions: Number(settings.numberOfQuestions),
      timeLimit: Math.max(15, Number(settings.timeMinutes)) * 60,
      showTimer: true,
      shuffleQuestions: true,
      shuffleOptions: true,
    });
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Mock Tests
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Test your preparation with these mock tests.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700"
            htmlFor="candidate-name"
          >
            Name
          </label>
          <input
            id="candidate-name"
            value={settings.submittedBy}
            onChange={(e) =>
              setSettings({ ...settings, submittedBy: e.target.value })
            }
            placeholder="Enter your name"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Question Paper Set
            </label>
            <button
              type="button"
              onClick={onRefreshSets}
              className="mr-3 px-1 py-1 text-xs font-semibold text-blue-700 underline-offset-4 transition-colors duration-200 hover:text-blue-900 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div ref={setMenuRef} className="relative">
            <button
              ref={setTriggerRef}
              type="button"
              disabled={isLoadingSets || questionSets.length === 0}
              aria-haspopup="listbox"
              aria-expanded={isSetMenuOpen}
              aria-controls="question-set-listbox"
              aria-describedby={`set-helper ${fieldErrors.set ? "set-error" : ""}`}
              onClick={() => (isSetMenuOpen ? closeSetMenu() : openSetMenu())}
              onKeyDown={handleSetTriggerKeyDown}
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-left text-slate-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                fieldErrors.set
                  ? "border-amber-300 focus:border-amber-400"
                  : "border-slate-300 focus:border-blue-500"
              }`}
            >
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="4"
                    width="14"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7 8H13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 11.5H11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <span className="block truncate">
                {selectedSet?.label ||
                  (isLoadingSets ? "Loading sets..." : "Select set")}
              </span>

              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${isSetMenuOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isSetMenuOpen && questionSets.length > 0 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <ul
                  ref={setListRef}
                  id="question-set-listbox"
                  role="listbox"
                  tabIndex={0}
                  aria-activedescendant={
                    highlightedSetIndex >= 0
                      ? `set-option-${highlightedSetIndex}`
                      : undefined
                  }
                  onKeyDown={handleSetListKeyDown}
                  className="max-h-64 overflow-auto py-1"
                >
                  {questionSets.map((setItem, index) => (
                    <li key={setItem.id}>
                      <button
                        type="button"
                        role="option"
                        id={`set-option-${index}`}
                        aria-selected={setItem.file === selectedSetFile}
                        onClick={() => handleSetSelect(setItem.file)}
                        onMouseEnter={() => setHighlightedSetIndex(index)}
                        onMouseLeave={() => {}}
                        tabIndex={-1}
                        className={`w-full cursor-pointer px-4 py-3 text-left text-sm transition-colors ${
                          highlightedSetIndex === index
                            ? "bg-blue-500 text-white"
                            : setItem.file === selectedSetFile
                              ? "bg-blue-50 text-blue-900 hover:bg-blue-100"
                              : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">{setItem.label}</span>
                          <span className="text-xs font-medium">
                            {setItem.questionCount} questions
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p id="set-helper" className="mt-2 text-xs text-slate-500">
            Use refresh if new question sets are added by admin.
          </p>
          {selectedSet && (
            <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {selectedSet.label} • {selectedSet.questionCount} questions
            </div>
          )}
          {fieldErrors.set && (
            <p
              id="set-error"
              className="mt-1 text-xs font-medium text-amber-700"
            >
              {fieldErrors.set}
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="question-count"
            >
              Number of Questions
            </label>
            <input
              id="question-count"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={selectedSet?.questionCount || 500}
              step={1}
              value={settings.numberOfQuestions}
              onChange={(e) => {
                const nextValue = sanitizeWholeNumberInput(e.target.value);
                setSettings({
                  ...settings,
                  numberOfQuestions: nextValue,
                });
              }}
              onBlur={() =>
                clampWholeNumberField("numberOfQuestions", {
                  min: 1,
                  max: selectedSet?.questionCount || 500,
                  fallback: 1,
                })
              }
              onKeyDown={(event) =>
                handleNumberKeyDown(event, "numberOfQuestions", {
                  min: 1,
                  max: selectedSet?.questionCount || 500,
                  step: 1,
                })
              }
              aria-describedby={`questions-helper ${fieldErrors.questions ? "questions-error" : ""}`}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100 [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100 ${
                fieldErrors.questions
                  ? "border-amber-300 focus:border-amber-400"
                  : "border-slate-300 focus:border-blue-500"
              }`}
            />
            <p id="questions-helper" className="mt-1 text-xs text-slate-500">
              Enter directly or use arrow keys.
            </p>
            {fieldErrors.questions && (
              <p
                id="questions-error"
                className="mt-1 text-xs font-medium text-amber-700"
              >
                {fieldErrors.questions}
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="time-limit"
            >
              Time Limit (minutes)
            </label>
            <input
              id="time-limit"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={15}
              max={720}
              step={15}
              value={settings.timeMinutes}
              onChange={(e) => {
                const nextValue = sanitizeWholeNumberInput(e.target.value);
                setSettings({
                  ...settings,
                  timeMinutes: nextValue,
                });
              }}
              onBlur={() =>
                clampWholeNumberField("timeMinutes", {
                  min: 15,
                  max: 720,
                  fallback: 60,
                })
              }
              onKeyDown={(event) =>
                handleNumberKeyDown(event, "timeMinutes", {
                  min: 15,
                  max: 720,
                  step: 15,
                })
              }
              aria-describedby={`time-helper ${fieldErrors.time ? "time-error" : ""}`}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100 [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100 ${
                fieldErrors.time
                  ? "border-amber-300 focus:border-amber-400"
                  : "border-slate-300 focus:border-blue-500"
              }`}
            />
            <p id="time-helper" className="mt-1 text-xs text-slate-500">
              Step change: 15 minutes.
            </p>
            {fieldErrors.time && (
              <p
                id="time-error"
                className="mt-1 text-xs font-medium text-amber-700"
              >
                {fieldErrors.time}
              </p>
            )}
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {validationErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl border-2 border-slate-100 bg-violet-50 px-6 py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-800 hover:border-slate-800 hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? "Starting..." : "Start Quiz"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">Best of Luck!</p>
      </div>
    </div>
  );
}
