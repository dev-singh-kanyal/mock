/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Shuffle options for one question and remap the answer index.
 */
export const shuffleQuestionOptions = (question) => {
  const optionsWithIndex = question.options.map((option, index) => ({
    option,
    originalIndex: index,
  }));

  const shuffled = shuffleArray(optionsWithIndex);
  const remappedAnswer = shuffled.findIndex(
    (item) => item.originalIndex === question.answer,
  );

  return {
    ...question,
    options: shuffled.map((item) => item.option),
    answer: remappedAnswer,
  };
};

/**
 * Calculate quiz results
 */
export const calculateResults = (questions, userAnswers) => {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];

    if (userAnswer === undefined || userAnswer === null) {
      unanswered++;
    } else if (userAnswer === question.answer) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    correct,
    incorrect,
    unanswered,
    total,
    percentage,
  };
};

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Get grade based on percentage
 */
export const getGrade = (percentage) => {
  if (percentage >= 90) return { grade: "A+", message: "Outstanding!" };
  if (percentage >= 80) return { grade: "A", message: "Excellent!" };
  if (percentage >= 70) return { grade: "B", message: "Good Job!" };
  if (percentage >= 60) return { grade: "C", message: "Not Bad!" };
  if (percentage >= 50) return { grade: "D", message: "Keep Practicing!" };
  return { grade: "F", message: "Need More Practice!" };
};
