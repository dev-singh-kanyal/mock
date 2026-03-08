import { formatTime } from "../utils/quizHelpers";

export default function Timer({ timeLeft, totalTime }) {
  const percentage = (timeLeft / totalTime) * 100;
  let colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";

  if (percentage <= 25) {
    colorClass = "text-red-700 bg-red-50 border-red-200";
  } else if (percentage <= 50) {
    colorClass = "text-amber-700 bg-amber-50 border-amber-200";
  } else if (percentage <= 75) {
    colorClass = "text-blue-700 bg-blue-50 border-blue-200";
  }

  return (
    <div
      className={`rounded-full border px-3 py-1.5 font-mono text-sm font-semibold ${colorClass}`}
      title="Remaining time"
    >
      {formatTime(timeLeft)}
    </div>
  );
}
