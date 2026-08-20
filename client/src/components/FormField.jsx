/**
 * Label + input + server-driven error line.
 *
 * The error comes from the API's per-field map (AGENTS.md, HTTP 400); this
 * component never invents its own rule. `aria-invalid` stays undefined when
 * valid — `false` makes some screen readers announce "invalid: false".
 *
 * @param {string} id
 * @param {string} label            Arabic label
 * @param {string} value
 * @param {(event: object) => void} onChange
 * @param {string} [error]          Arabic message for this field
 * @param {string} [type]
 * @param {string} [name]
 * @param {"rtl"|"ltr"} [dir]       "ltr" for email, URL, phone, reference numbers
 * @param {string} [hint]
 * @param {string} [autoComplete]
 * @param {boolean} [disabled]
 * @param {boolean} [required]
 */
const FormField = ({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  name,
  dir,
  hint,
  autoComplete,
  disabled = false,
  required = false,
}) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-error">
            {" *"}
          </span>
        ) : null}
      </label>

      <input
        id={id}
        name={name ?? id}
        type={type}
        dir={dir}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-full rounded-field border bg-surface px-3 py-2 text-ink text-start
          placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-60
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green
          ${error ? "border-error" : "border-border"}`}
      />

      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
