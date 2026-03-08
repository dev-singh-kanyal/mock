export default function OptionButton({
  option,
  index,
  isSelected,
  onSelect,
  disabled,
}) {
  const letters = ["A", "B", "C", "D"];

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled}
      className={`w-full rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-300 bg-white hover:border-blue-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-semibold ${
            isSelected
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {letters[index]}
        </div>
        <span className="text-slate-800">{option}</span>
      </div>
    </button>
  );
}
