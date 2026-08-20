/**
 * File input with the same label / error / aria contract as FormField.
 *
 * A file input cannot be controlled, so the page owns the File object and
 * passes `fileName` back for display. `accept` is a convenience for the file
 * picker only — the server validates type and size and is the authority
 * (NFR-S7, NFR-S8).
 *
 * @param {string} id
 * @param {string} label            Arabic label
 * @param {(file: File | null) => void} onChange
 * @param {string} [fileName]       name of the currently selected file
 * @param {string} [accept]
 * @param {string} [hint]           Arabic helper text: accepted types and cap
 * @param {string} [error]          Arabic message for this field
 * @param {boolean} [disabled]
 * @param {boolean} [required]
 */
const FileField = ({
  id,
  label,
  onChange,
  fileName,
  accept,
  hint,
  error,
  disabled = false,
  required = false,
}) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const nameId = `${id}-name`;
  const describedBy = [error ? errorId : null, hint ? hintId : null, fileName ? nameId : null]
    .filter(Boolean)
    .join(" ");

  const handleChange = (event) => onChange(event.target.files?.[0] ?? null);

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
        name={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-full rounded-field border bg-surface px-3 py-2 text-sm text-ink
          file:me-3 file:rounded-control file:border-0 file:bg-paper file:px-3 file:py-1
          file:text-sm file:text-ink disabled:cursor-not-allowed disabled:opacity-60
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green
          ${error ? "border-error" : "border-border"}`}
      />

      {fileName ? (
        <p id={nameId} className="mt-1 text-xs text-text-secondary">
          الملف المحدد: <bdi>{fileName}</bdi>
        </p>
      ) : null}

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

export default FileField;
