import { useCallback, useEffect, useState } from "react";
import SetupScreen from "./components/SetupScreen";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";
import { useQuiz } from "./hooks/useQuiz";

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

const toRoute = (pathname) => {
  const withoutBase = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;

  if (withoutBase === "/exam") return "/exam";
  if (withoutBase === "/result") return "/result";
  return "/";
};

const toPathname = (route) => {
  if (route === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${route}`;
};

function App() {
  const [route, setRoute] = useState(() => toRoute(window.location.pathname));
  const isExamRoute = route === "/exam";
  const isResultRoute = route === "/result";
  const {
    questions,
    currentIndex,
    userAnswers,
    visitedQuestions,
    flaggedQuestions,
    results,
    settings,
    isLoading,
    isLoadingSets,
    questionSets,
    submissions,
    error,
    hasActiveQuiz,
    refreshQuestionSets,
    startQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    jumpToQuestion,
    toggleFlagQuestion,
    submitQuiz,
    deleteSubmission,
    resetQuiz,
  } = useQuiz();

  const navigate = useCallback((nextRoute, { replace = false } = {}) => {
    const nextPath = toPathname(nextRoute);
    const nextUrl = `${nextPath}${window.location.search}`;

    if (replace) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }

    setRoute(nextRoute);
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(toRoute(window.location.pathname));
    };

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (route === "/exam" && !hasActiveQuiz) {
      const timerId = window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 0);

      return () => window.clearTimeout(timerId);
    }
  }, [route, hasActiveQuiz, navigate]);

  useEffect(() => {
    if (route === "/result" && !results && submissions.length === 0) {
      const timerId = window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 0);

      return () => window.clearTimeout(timerId);
    }
  }, [route, results, submissions.length, navigate]);

  const handleStart = async (quizSettings) => {
    const success = await startQuiz(quizSettings);
    if (success) {
      navigate("/exam");
    }
  };

  const handleSubmit = (meta = {}) => {
    const calculated = submitQuiz({
      ...meta,
      submittedBy: settings?.submittedBy || "Anonymous",
      submittedAt: new Date().toISOString(),
    });

    if (calculated) {
      navigate("/result");
    }
  };

  const handleRestart = () => {
    resetQuiz();
    navigate("/");
  };

  return (
    <div
      className={`min-h-screen ${isExamRoute ? "py-4 px-0" : isResultRoute ? "py-6 px-2 sm:px-4" : "py-8 px-4 sm:px-6"}`}
    >
      <div
        className={
          isExamRoute
            ? "w-full"
            : isResultRoute
              ? "mx-auto w-[98%] max-w-none"
              : "mx-auto w-full max-w-6xl"
        }
      >
        {route === "/" && (
          <SetupScreen
            onStart={handleStart}
            isLoading={isLoading}
            isLoadingSets={isLoadingSets}
            questionSets={questionSets}
            onRefreshSets={refreshQuestionSets}
          />
        )}

        {route === "/" && error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {route === "/" && isLoading && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Loading questions...
          </p>
        )}

        {route === "/exam" && hasActiveQuiz && (
          <QuizScreen
            questions={questions}
            currentIndex={currentIndex}
            userAnswers={userAnswers}
            visitedQuestions={visitedQuestions}
            flaggedQuestions={flaggedQuestions}
            settings={settings}
            onSelectAnswer={selectAnswer}
            onNext={nextQuestion}
            onPrevious={previousQuestion}
            onJumpToQuestion={jumpToQuestion}
            onToggleFlag={toggleFlagQuestion}
            onSubmit={handleSubmit}
          />
        )}

        {route === "/result" && (results || submissions.length > 0) && (
          <ResultsScreen
            results={results}
            submissions={submissions}
            onRestart={handleRestart}
            onDeleteSubmission={deleteSubmission}
          />
        )}
      </div>
    </div>
  );
}

export default App;
