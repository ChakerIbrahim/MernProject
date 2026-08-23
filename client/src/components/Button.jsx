const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-control border px-4 py-2 text-sm font-medium " +
  "transition-colors duration-150 ease-out " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green " +
  "disabled:cursor-not-allowed disabled:opacity-60";

// design.md §2: registry-green for primary, flag-red for destructive (NFR-U4).
const VARIANT_CLASSES = {
  primary:
    "border-registry-green bg-registry-green text-surface hover:border-green-dark hover:bg-green-dark",
  secondary: "border-border bg-surface text-ink hover:bg-paper",
  danger: "border-flag-red bg-flag-red text-surface hover:opacity-90",
};

/**
 * @param {"primary"|"secondary"|"danger"} [variant]
 * @param {"button"|"submit"} [type]
 * @param {boolean} [disabled]
 * @param {boolean} [isLoading]  disables the button and shows a spinner —
 *                               a second click firing a second request is a
 *                               real bug in a bidding system
 * @param {boolean} [fullWidth]
 * @param {string} [title]      native tooltip, e.g. why a control is disabled
 * @param {() => void} [onClick]
 * @param {React.ReactNode} children
 */
const Button = ({
  variant = "primary",
  type = "button",
  disabled = false,
  isLoading = false,
  fullWidth = false,
  title,
  onClick,
  children,
}) => (
  <button
    type={type}
    onClick={onClick}
    title={title}
    disabled={disabled || isLoading}
    aria-busy={isLoading ? true : undefined}
    className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""}`}
  >
    {isLoading ? (
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
      />
    ) : null}
    {children}
  </button>
);

export default Button;
