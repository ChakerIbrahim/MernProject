import React from 'react';

export default function FormField({ label, id, error, isValid, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className={`w-full border-2 rounded-md p-3 bg-surface text-ink placeholder:text-text-secondary focus-visible:outline-1 focus-visible:outline-registry-green ${
          props.dir === 'ltr' ? 'text-start' : ''
        } ${
          error ? 'border-error focus:ring-1 focus:ring-error' : isValid ? 'border-info focus:border-info focus:ring-1 focus:ring-info' : 'border-ink/20 focus:border-registry-green focus:ring-1 focus:ring-registry-green'
        } ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-sm text-error mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
