import PropTypes from 'prop-types';
import { useEffect } from 'react';
import Button from './Button';

export default function ConfirmDialog({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, isDestructive }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm transition-opacity" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message">
        <h2 id="dialog-title" className="mb-2 text-lg font-bold text-ink">{title}</h2>
        <p id="dialog-message" className="mb-6 text-sm leading-relaxed text-text-secondary">{message}</p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>{cancelLabel || 'إلغاء'}</Button>
          <Button variant={isDestructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel || 'تأكيد'}</Button>
        </div>
      </div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isDestructive: PropTypes.bool
};
