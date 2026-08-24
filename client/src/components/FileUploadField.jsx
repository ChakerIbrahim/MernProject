import PropTypes from 'prop-types';

export default function FileUploadField({ id, label, accept, hint, error, onChange }) {
  const errorId = `${id}-error`;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mb-2 text-xs text-text-secondary">{hint}</p>}
      <div className={`relative flex items-center justify-center w-full rounded-xl border-2 border-dashed p-6 transition-colors focus-within:ring-1 focus-within:ring-registry-green focus-within:ring-offset-1 ${error ? 'border-error bg-red-50/50' : 'border-ink/20 bg-paper hover:bg-surface'}`}>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="text-center">
          <svg className={`mx-auto h-10 w-10 mb-2 ${error ? 'text-error' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm font-medium text-registry-green">انقر لاختيار ملف</span>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

FileUploadField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  accept: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired
};
