/**
 * Progress indication for anything that takes more than a moment —
 * uploads, AI analysis, list loads (NFR-U3).
 *
 * @param {string} [label] Arabic label announced to screen readers
 */
const Spinner = ({ label = "جاري التحميل…" }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex flex-col items-center justify-center gap-3 py-10"
  >
    <span
      aria-hidden="true"
      className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-registry-green motion-reduce:animate-none"
    />
    <p className="text-sm text-text-secondary">{label}</p>
  </div>
);

export default Spinner;
