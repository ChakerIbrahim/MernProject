// design.md §2 — colour never carries meaning alone. Every band pairs its
// colour with an Arabic word, so a colour-blind or screen-reader user gets the
// same information.
const BANDS = [
  { min: 80, label: "ثقة مرتفعة", bar: "bg-registry-green", text: "text-registry-green" },
  { min: 50, label: "ثقة متوسطة", bar: "bg-warning", text: "text-warning" },
  { min: 0, label: "ثقة منخفضة", bar: "bg-error", text: "text-error" },
];


const ConfidenceMeter = ({ score }) => {
  if (typeof score !== "number" || Number.isNaN(score)) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = BANDS.find((b) => clamped >= b.min) ?? BANDS[BANDS.length - 1];

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-text-secondary">درجة ثقة التحليل</span>
        <span className={`text-sm font-medium ${band.text}`}>
          {band.label} — <bdi className="tabular-nums">{clamped}%</bdi>
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`درجة ثقة التحليل: ${band.label}`}
        className="h-2 w-full overflow-hidden rounded-control border border-border bg-paper"
      >
        <div className={`h-full ${band.bar}`} style={{ width: `${clamped}%` }} />
      </div>

      <p className="mt-1 text-xs text-text-secondary">
        هذا تقدير آلي من تحليل المستند، وليس رقماً مؤكداً. راجعه قبل الاعتماد عليه.
      </p>
    </div>
  );
};

export default ConfidenceMeter;
