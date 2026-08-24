import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-1 focus-visible:outline-offset-1";

  const variants = {
    primary: "bg-registry-green text-surface hover:bg-green-dark focus-visible:outline-registry-green",
    secondary: "border border-ink/15 bg-transparent text-ink hover:bg-ink/5",
    "secondary-dark": "border border-surface/20 bg-surface/10 text-surface backdrop-blur-sm hover:bg-surface/20",
    danger: "bg-error text-surface hover:bg-error/80 focus-visible:outline-error"
  };

  return (
    <button className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
