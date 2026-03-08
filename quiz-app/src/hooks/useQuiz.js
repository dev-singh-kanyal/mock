import { useState, useCallback, useEffect } from "react";
import {
  shuffleArray,
  shuffleQuestionOptions,
  calculateResults,
} from "../utils/quizHelpers";

const SUBMISSIONS_STORAGE_KEY = "quiz_submissions_v1";

const loadSubmissions = () => {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistSubmissions = (submissions) => {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  } catch {
    // Ignore storage errors.
  }
};

const isValidQuestionBank = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return false;
  }

  return questions.every((question) => {
    return (
      typeof question?.question === "string" &&
      Array.isArray(question?.options) &&
      question.options.length >= 2 &&
      Number.isInteger(question?.answer) &&
      question.answer >= 0 &&
      question.answer < question.options.length
    );
  });
};

const tryLoadSetFile = async (baseUrl, file, label) => {
  try {
    const response = await fetch(`${baseUrl}${file}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return null;
    }

    const data = await response.json();
    if (!isValidQuestionBank(data)) {
      console.warn(`[quiz] Skipping invalid question set: ${file}`);
      return null;
    }

    return {
      id: file.replace(".json", ""),
      file,
      label,
      questionCount: data.length,
    };
  } catch (error) {
    console.warn(`[quiz] Failed reading set file ${file}`, error);
    return null;
  }
};

const discoverQuestionSets = async () => {
  const baseUrl = import.meta.env.BASE_URL;
  const discoveredSets = [];

  for (let index = 1; index <= 50; index += 1) {
    const file = `set${index}.json`;
    const discovered = await tryLoadSetFile(baseUrl, file, `Set ${index}`);
    if (discovered) {
      discoveredSets.push(discovered);
    }
  }

  const legacySet = await tryLoadSetFile(
    baseUrl,
    "questions.json",
    "Default Set",
  );
  if (legacySet) {
    discoveredSets.push(legacySet);
  }

  return discoveredSets;
};

export const useQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [results, setResults] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [error, setError] = useState("");
  const [questionSets, setQuestionSets] = useState([]);
  const [submissions, setSubmissions] = useState(() => loadSubmissions());

  const refreshQuestionSets = useCallback(async () => {
    setIsLoadingSets(true);
    try {
      const sets = await discoverQuestionSets();
      if (sets.length === 0) {
        throw new Error(
          "No question sets found. Add files like set1.json in public folder.",
        );
      }
      setQuestionSets(sets);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to discover question sets.");
    } finally {
      setIsLoadingSets(false);
    }
  }, []);

  useEffect(() => {
    refreshQuestionSets();

    const onFocus = () => {
      refreshQuestionSets();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshQuestionSets]);

  const startQuiz = useCallback(
    async (quizSettings) => {
      setIsLoading(true);
      setError("");

      try {
        const selectedSet =
          questionSets.find(
            (setItem) => setItem.file === quizSettings.setFile,
          ) || questionSets[0];

        if (!selectedSet) {
          throw new Error("No question set available.");
        }

        const questionsUrl = `${import.meta.env.BASE_URL}${selectedSet.file}`;
        const response = await fetch(questionsUrl);
        if (!response.ok) {
          throw new Error(`Failed to load questions (${response.status})`);
        }

        const allQuestions = await response.json();
        if (!isValidQuestionBank(allQuestions)) {
          throw new Error("Question data is invalid or empty.");
        }

        if (quizSettings.numberOfQuestions > allQuestions.length) {
          throw new Error(
            `Requested ${quizSettings.numberOfQuestions} questions, but only ${allQuestions.length} are available in ${selectedSet.label}.`,
          );
        }

        let selectedQuestions = [...allQuestions];

        if (quizSettings.shuffleQuestions) {
          selectedQuestions = shuffleArray(selectedQuestions);
        }

        if (quizSettings.shuffleOptions) {
          selectedQuestions = selectedQuestions.map((question) =>
            shuffleQuestionOptions(question),
          );
        }

        selectedQuestions = selectedQuestions.slice(
          0,
          quizSettings.numberOfQuestions,
        );

        setQuestions(selectedQuestions);
        setSettings({
          ...quizSettings,
          setFile: selectedSet.file,
          setLabel: selectedSet.label,
        });
        setCurrentIndex(0);
        setUserAnswers({});
        setVisitedQuestions({ 0: true });
        setFlaggedQuestions({});
        setResults(null);

        return true;
      } catch (startError) {
        console.error("Error loading questions:", startError);
        setError(startError.message || "Unable to start quiz.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [questionSets],
  );

  const selectAnswer = useCallback((questionIndex, answerIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
    setVisitedQuestions((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.min(prev + 1, questions.length - 1);
      setVisitedQuestions((visited) => ({ ...visited, [next]: true }));
      return next;
    });
  }, [questions.length]);

  const previousQuestion = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      setVisitedQuestions((visited) => ({ ...visited, [next]: true }));
      return next;
    });
  }, []);

  const jumpToQuestion = useCallback(
    (index) => {
      if (index >= 0 && index < questions.length) {
        setCurrentIndex(index);
        setVisitedQuestions((prev) => ({
          ...prev,
          [index]: true,
        }));
      }
    },
    [questions.length],
  );

  const toggleFlagQuestion = useCallback((questionIndex) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  }, []);

  const submitQuiz = useCallback(
    (submissionMeta = {}) => {
      if (questions.length === 0) {
        return null;
      }

      const submittedAt =
        submissionMeta.submittedAt || new Date().toISOString();
      const submittedBy =
        submissionMeta.submittedBy || settings?.submittedBy || "Anonymous";

      const calculatedResults = calculateResults(questions, userAnswers);
      const attemptedCount =
        calculatedResults.correct + calculatedResults.incorrect;
      const markedForReviewCount =
        Object.values(flaggedQuestions).filter(Boolean).length;
      const completionRate =
        calculatedResults.total > 0
          ? Math.round((attemptedCount / calculatedResults.total) * 100)
          : 0;
      const accuracyPercent =
        attemptedCount > 0
          ? Math.round((calculatedResults.correct / attemptedCount) * 100)
          : 0;
      const submission = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        submittedAt,
        submittedBy,
        setLabel: settings?.setLabel || "Quiz Set",
        totalQuestions: calculatedResults.total,
        attempted: attemptedCount,
        scorePercent: calculatedResults.percentage,
        correct: calculatedResults.correct,
        incorrect: calculatedResults.incorrect,
        unanswered: calculatedResults.unanswered,
        markedForReview: markedForReviewCount,
        completionRate,
        accuracyPercent,
        reason: submissionMeta.reason || "submitted",
        details: questions.map((question, index) => {
          const selectedIndex = userAnswers[index];
          const isAnswered =
            selectedIndex !== undefined && selectedIndex !== null;

          return {
            id: question.id || `q-${index + 1}`,
            questionNumber: index + 1,
            question: question.question,
            options: question.options,
            selectedIndex: isAnswered ? selectedIndex : null,
            correctIndex: question.answer,
            explanation: question.explanation || "",
          };
        }),
      };

      console.info("[quiz] Submission saved", {
        submittedBy,
        setLabel: submission.setLabel,
        scorePercent: submission.scorePercent,
      });

      const calculatedWithMeta = {
        ...calculatedResults,
        submission,
      };

      setResults(calculatedWithMeta);
      setSubmissions((prev) => {
        const updated = [submission, ...prev];
        persistSubmissions(updated);
        return updated;
      });

      return calculatedWithMeta;
    },
    [flaggedQuestions, questions, settings, userAnswers],
  );

  const deleteSubmission = useCallback(
    (submissionId) => {
      setSubmissions((prev) => {
        const updated = prev.filter((item) => item.id !== submissionId);
        persistSubmissions(updated);
        return updated;
      });

      if (results?.submission?.id === submissionId) {
        setResults(null);
      }
    },
    [results],
  );

  const resetQuiz = useCallback(() => {
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
    setVisitedQuestions({});
    setFlaggedQuestions({});
    setResults(null);
    setSettings(null);
    setError("");
  }, []);

  const hasActiveQuiz = questions.length > 0 && results === null;

  return {
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
  };
};
