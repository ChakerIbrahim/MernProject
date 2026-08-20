import Button from "./Button";

/**
 * An empty data set gets an explanatory sentence, never a blank region
 * (NFR-U5).
 *
 * @param {string} message      Arabic sentence explaining the emptiness
 * @param {string} [actionLabel] Arabic label for the optional action
 * @param {() => void} [onAction]
 */
const EmptyState = ({ message, actionLabel, onAction }) => (
  <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-10 text-center">
    <p className="text-text-secondary">{message}</p>
    {actionLabel && onAction ? (
      <Button variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default EmptyState;
