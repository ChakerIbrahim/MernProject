import Button from "./Button";

/**
 * A failed load. The message is always a written Arabic sentence — never a
 * raw exception or an HTTP status code.
 *
 * @param {string} message
 * @param {() => void} [onRetry]
 */
const ErrorState = ({ message = "تعذّر تحميل البيانات. حاول مرة أخرى.", onRetry }) => (
  <div
    role="alert"
    className="flex flex-col items-center gap-4 rounded-card border border-error bg-surface px-6 py-10 text-center"
  >
    <p className="text-error">{message}</p>
    {onRetry ? (
      <Button variant="secondary" onClick={onRetry}>
        إعادة المحاولة
      </Button>
    ) : null}
  </div>
);

export default ErrorState;
