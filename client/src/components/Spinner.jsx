import React from 'react';

export default function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-3">
      <div className="w-8 h-8 border-4 border-border border-t-registry-green rounded-full animate-spin"></div>
      {label && <span className="text-text-secondary text-sm font-medium">{label}</span>}
    </div>
  );
}
