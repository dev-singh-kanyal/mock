import { useMemo, useState } from "react";
import { getGrade } from "../utils/quizHelpers";

const formatSubmittedAt = (isoTime) => {
  if (!isoTime) return "-";
  const date = new Date(isoTime);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const getSubmissionMetrics = (submission) => {
  const total = Number(submission?.totalQuestions || 0);
  const correct = Number(submission?.correct || 0);
  const incorrect = Number(submission?.incorrect || 0);
  const unanswered = Number(submission?.unanswered || 0);
  const attempted = Number.isFinite(submission?.attempted)
    ? Number(submission.attempted)
    : Math.max(0, total - unanswered);
  const markedForReview = Number.isFinite(submission?.markedForReview)
    ? Number(submission.markedForReview)
    : 0;
  const completionRate = Number.isFinite(submission?.completionRate)
    ? Number(submission.completionRate)
    : total > 0
      ? Math.round((attempted / total) * 100)
      : 0;
  const accuracy = Number.isFinite(submission?.accuracyPercent)
    ? Number(submission.accuracyPercent)
    : attempted > 0
      ? Math.round((correct / attempted) * 100)
      : 0;

  return {
    total,
    correct,
    incorrect,
    attempted,
    markedForReview,
    notAttempted: unanswered,
    completionRate,
    accuracy,
  };
};

export default function ResultsScreen({
  results,
  submissions,
  onRestart,
  onDeleteSubmission,
}) {
  const [openSubmissionId, setOpenSubmissionId] = useState(
    results?.submission?.id || submissions[0]?.id || null,
  );
  const [selectedSubmittedBy, setSelectedSubmittedBy] = useState("ALL");
  const [selectedSetLabel, setSelectedSetLabel] = useState("ALL");

  const latestSubmission = results?.submission || submissions[0] || null;

  const submittedByOptions = useMemo(
    () => ["ALL", ...new Set(submissions.map((item) => item.submittedBy))],
    [submissions],
  );

  const setLabelOptions = useMemo(
    () => ["ALL", ...new Set(submissions.map((item) => item.setLabel))],
    [submissions],
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((item) => {
        const nameMatches =
          selectedSubmittedBy === "ALL" ||
          item.submittedBy === selectedSubmittedBy;
        const setMatches =
          selectedSetLabel === "ALL" || item.setLabel === selectedSetLabel;
        return nameMatches && setMatches;
      }),
    [selectedSetLabel, selectedSubmittedBy, submissions],
  );

  const openSubmission = filteredSubmissions.find(
    (item) => item.id === openSubmissionId,
  );
  const hasOpenDetails = Boolean(
    openSubmission && Array.isArray(openSubmission.details),
  );

  const activeSubmission = openSubmission || latestSubmission;
  const activePercentage = activeSubmission?.scorePercent ?? null;
  const gradeInfo =
    activePercentage === null ? null : getGrade(Number(activePercentage));

  const activeMetrics = activeSubmission
    ? getSubmissionMetrics(activeSubmission)
    : null;

  return (
    <div
      className={`mx-auto w-[98%] max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${
        hasOpenDetails
          ? "hide-scrollbar h-[calc(100vh-2rem)] overflow-y-auto"
          : "h-[calc(100vh-2rem)] overflow-hidden"
      }`}
    >
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Results</h1>
          <p className="mt-1 text-sm text-slate-600">
            Latest submission summary and past attempts.
          </p>
        </div>

        <button
          onClick={onRestart}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back To Home
        </button>
      </div>

      <div
        className={
          hasOpenDetails
            ? "pr-1"
            : "hide-scrollbar h-[calc(100%-84px)] overflow-y-auto pr-1"
        }
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <section className="h-full">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Submission
            </h2>

            <div className="rounded-xl border border-slate-200 p-3 lg:h-[330px] lg:flex lg:flex-col">
              {activeSubmission ? (
                <>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Candidate
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                        {activeSubmission.submittedBy}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Set
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {activeSubmission.setLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                      <p className="text-[11px] text-slate-600">
                        Not Attempted
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeMetrics.notAttempted}
                      </p>
                    </div>
                    <div className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1.5">
                      <p className="text-[11px] text-indigo-700">Attempted</p>
                      <p className="text-sm font-semibold text-indigo-900">
                        {activeMetrics.attempted}
                      </p>
                    </div>
                    <div className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5">
                      <p className="text-[11px] text-blue-700">
                        Correct / Total
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {activeMetrics.correct} / {activeMetrics.total}
                      </p>
                    </div>
                    <div className="rounded-md border border-amber-100 bg-amber-50 px-2 py-1.5">
                      <p className="text-[11px] text-amber-700">Marked</p>
                      <p className="text-sm font-semibold text-amber-900">
                        {activeMetrics.markedForReview}
                      </p>
                    </div>
                    <div className="rounded-md border border-rose-100 bg-rose-50 px-2 py-1.5">
                      <p className="text-[11px] text-rose-700">Incorrect</p>
                      <p className="text-sm font-semibold text-rose-900">
                        {activeMetrics.incorrect}
                      </p>
                    </div>
                    <div className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                      <p className="text-[11px] text-emerald-700">Accuracy</p>
                      <p className="text-sm font-semibold text-emerald-900">
                        {activeMetrics.accuracy}%
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                      <p className="text-[11px] text-slate-600">Submitted</p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {formatSubmittedAt(activeSubmission.submittedAt)}
                      </p>
                    </div>
                    <div className="rounded-md border border-violet-100 bg-violet-50 px-2 py-1.5">
                      <p className="text-[11px] text-emerald-700">Grade</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {gradeInfo ? gradeInfo.grade : "-"}
                      </p>
                    </div>
                    <div className="rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1.5">
                      <p className="text-[11px] text-cyan-700">
                        Completion Rate
                      </p>
                      <p className="text-sm font-semibold text-cyan-900">
                        {activeMetrics.completionRate}%
                      </p>
                    </div>
                  </div>

                  {gradeInfo && (
                    <p className="mt-3 text-xs text-slate-600 lg:mt-auto lg:pt-2">
                      {gradeInfo.message}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
                  No submission selected.
                </div>
              )}
            </div>
          </section>

          <section className="h-full">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Past Submissions
            </h2>

            {submissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No submissions yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 lg:h-[330px] lg:flex lg:flex-col">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-xs uppercase tracking-wide">
                            Submitted By
                          </span>
                          <select
                            value={selectedSubmittedBy}
                            onChange={(event) =>
                              setSelectedSubmittedBy(event.target.value)
                            }
                            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                          >
                            {submittedByOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </th>
                      <th className="w-[150px] px-4 py-2.5 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-xs uppercase tracking-wide">
                            Set
                          </span>
                          <select
                            value={selectedSetLabel}
                            onChange={(event) =>
                              setSelectedSetLabel(event.target.value)
                            }
                            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                          >
                            {setLabelOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </th>
                      <th className="w-[170px] px-4 py-2.5 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>

                <div className="hide-scrollbar max-h-[230px] overflow-y-auto lg:max-h-none lg:flex-1">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                    <tbody>
                      {filteredSubmissions.length === 0 ? (
                        <tr className="border-t border-slate-200">
                          <td
                            colSpan={3}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            No submissions match current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((item) => (
                          <tr
                            key={item.id}
                            className="border-t border-slate-200"
                          >
                            <td
                              className="truncate px-4 py-1.5 text-slate-800"
                              title={item.submittedBy}
                            >
                              {item.submittedBy}
                            </td>
                            <td
                              className="w-[150px] truncate px-4 py-1.5 text-slate-700"
                              title={item.setLabel}
                            >
                              {item.setLabel}
                            </td>
                            <td className="w-[170px] px-4 py-1.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setOpenSubmissionId((prev) =>
                                      prev === item.id ? null : item.id,
                                    )
                                  }
                                  className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  {openSubmissionId === item.id
                                    ? "Hide"
                                    : "Open"}
                                </button>
                                <button
                                  onClick={() => {
                                    const shouldDelete = window.confirm(
                                      "Delete this submission permanently?",
                                    );
                                    if (!shouldDelete) return;

                                    if (openSubmissionId === item.id) {
                                      setOpenSubmissionId(null);
                                    }
                                    onDeleteSubmission(item.id);
                                  }}
                                  className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {hasOpenDetails && (
          <section className="mt-8">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Submission Detail: {openSubmission.submittedBy} (
              {openSubmission.scorePercent}
              %)
            </h3>

            <div
              className={
                hasOpenDetails
                  ? "space-y-3 pr-1"
                  : "hide-scrollbar max-h-[52vh] space-y-3 overflow-y-auto pr-1"
              }
            >
              {openSubmission.details.map((detail) => {
                const isAnswered = detail.selectedIndex !== null;
                const isCorrect = detail.selectedIndex === detail.correctIndex;

                return (
                  <div
                    key={detail.id}
                    className={`rounded-xl border p-4 ${
                      !isAnswered
                        ? "border-slate-200 bg-slate-50"
                        : isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="font-medium text-slate-800">
                      Q{detail.questionNumber}. {detail.question}
                    </p>

                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      {detail.options.map((option, optionIndex) => {
                        const isChosen = detail.selectedIndex === optionIndex;
                        const isAnswer = detail.correctIndex === optionIndex;

                        let optionClass = "border-slate-200 bg-white";

                        if (!isAnswered) {
                          // For unanswered questions, keep neutral tones and softly hint the correct answer.
                          optionClass = isAnswer
                            ? "border-sky-200 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-white";
                        } else if (isAnswer) {
                          optionClass = "border-emerald-300 bg-emerald-100";
                        } else if (isChosen) {
                          optionClass = "border-red-300 bg-red-100";
                        }

                        return (
                          <div
                            key={`${detail.id}-${optionIndex}`}
                            className={`rounded-lg border px-3 py-2 ${optionClass}`}
                          >
                            {option}
                            {isChosen && " (selected)"}
                            {isAnswer && " (correct)"}
                          </div>
                        );
                      })}
                    </div>

                    {detail.explanation && (
                      <p className="mt-3 text-sm text-slate-700">
                        <strong>Explanation:</strong> {detail.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
