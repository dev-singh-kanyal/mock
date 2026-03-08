import OptionButton from "./OptionButton";

export default function Question({ question, selectedAnswer, onSelectAnswer }) {
  return (
    <div className="space-y-6">
      {/*
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span className="font-medium">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === questionNumber - 1
                  ? "bg-blue-500"
                  : idx < questionNumber - 1
                    ? "bg-slate-500"
                    : "bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>
      */}

      <div className="hide-scrollbar h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold leading-relaxed text-slate-900">
          {question.question}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <OptionButton
            key={index}
            option={option}
            index={index}
            isSelected={selectedAnswer === index}
            onSelect={onSelectAnswer}
          />
        ))}
      </div>
    </div>
  );
}
