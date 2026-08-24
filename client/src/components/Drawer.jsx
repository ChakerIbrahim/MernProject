import PropTypes from 'prop-types';
import { useEffect } from 'react';

export default function Drawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-text-secondary hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green" aria-label="إغلاق">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

Drawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
