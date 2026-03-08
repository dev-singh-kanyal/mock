import { useEffect, useRef } from "react";
import Question from "./Question";
import Timer from "./Timer";
import { useTimer } from "../hooks/useTimer";

export default function QuizScreen({
  questions,
  currentIndex,
  userAnswers,
  visitedQuestions,
  flaggedQuestions,
  settings,
  onSelectAnswer,
  onNext,
  onPrevious,
  onJumpToQuestion,
  onToggleFlag,
  onSubmit,
}) {
  const navGridRef = useRef(null);

  const { timeLeft, start } = useTimer(settings.timeLimit, () =>
    onSubmit({ reason: "time_up" }),
  );

  useEffect(() => {
    if (settings.showTimer) {
      start();
    }
  }, [settings.showTimer, start]);

  useEffect(() => {
    const activeButton = navGridRef.current?.querySelector(
      `[data-question-index="${currentIndex}"]`,
    );

    activeButton?.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const hasCurrentResponse = userAnswers[currentIndex] !== undefined;

  const getQuestionStatusClass = (index) => {
    if (flaggedQuestions[index]) {
      return "border-orange-300 bg-orange-100 text-orange-800";
    }

    if (userAnswers[index] !== undefined) {
      return "border-emerald-300 bg-emerald-100 text-emerald-800";
    }

    if (visitedQuestions[index]) {
      return "border-slate-300 bg-slate-200 text-slate-700";
    }

    return "border-slate-200 bg-white text-slate-500";
  };

  return (
    <div className="mx-auto w-[98%] max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Exam</p>
          <h2 className="text-xl font-semibold text-slate-900">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {settings.showTimer && (
            <Timer timeLeft={timeLeft} totalTime={settings.timeLimit} />
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <div>
          <Question
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={userAnswers[currentIndex]}
            onSelectAnswer={(answerIndex) =>
              onSelectAnswer(currentIndex, answerIndex)
            }
          />

          <div className="mt-8 flex items-center justify-start gap-4">
            <button
              onClick={onPrevious}
              disabled={isFirstQuestion}
              className={`w-[20%] rounded-lg px-4 py-3 text-sm font-semibold transition ${
                isFirstQuestion
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              Previous
            </button>

            <button
              onClick={() => onToggleFlag(currentIndex)}
              className={`w-[20%] rounded-lg px-4 py-3 text-sm font-semibold transition ${
                flaggedQuestions[currentIndex]
                  ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {flaggedQuestions[currentIndex] ? "Marked" : "Mark for Review"}
            </button>

            {!isLastQuestion ? (
              <button
                onClick={onNext}
                className="w-[20%] rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => onSubmit({ reason: "submitted" })}
                className="w-[20%] rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Submit Quiz
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectAnswer(currentIndex, undefined)}
              disabled={!hasCurrentResponse}
              className={`w-[20%] rounded-lg px-4 py-3 text-sm font-semibold transition ${
                hasCurrentResponse
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              Clear Response
            </button>
          </div>
        </div>

        <aside className="h-[60vh] rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Navigation
          </p>

          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Answered
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Unanswered (visited)
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
              Unvisited
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-300" />
              Marked for review
            </div>
          </div>

          <div
            ref={navGridRef}
            className="hide-scrollbar h-[calc(60vh-88px)] overflow-y-auto px-1 py-1"
          >
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10">
              {questions.map((_, index) => (
                <button
                  key={index}
                  data-question-index={index}
                  onClick={() => onJumpToQuestion(index)}
                  className={`aspect-square w-full rounded-md border text-sm font-semibold transition ${getQuestionStatusClass(index)} ${
                    index === currentIndex ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
