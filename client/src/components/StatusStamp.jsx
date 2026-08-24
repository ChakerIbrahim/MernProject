import React from 'react';

export default function StatusStamp({ status }) {
  const config = {
    pending: { label: 'قيد المراجعة', classes: 'border-warning/30 bg-warning/10 text-warning' },
    approved: { label: 'مقبول', classes: 'border-success/30 bg-success/10 text-success' },
    rejected: { label: 'مرفوض', classes: 'border-error/30 bg-error/10 text-error' },
    active: { label: 'نشط', classes: 'border-registry-green/30 bg-registry-green/10 text-registry-green' },
    pending_approval: { label: 'بانتظار اعتماد المشرف', classes: 'border-warning/30 bg-warning/10 text-warning' },
    ended: { label: 'منتهي', classes: 'border-text-secondary/30 bg-text-secondary/10 text-text-secondary' },
    cancelled: { label: 'ملغى', classes: 'border-error/30 bg-error/10 text-error' },
    winning: { label: 'متصدّر حالياً', classes: 'border-success/30 bg-success/10 text-success' },
    outbid: { label: 'تمت المزايدة عليك', classes: 'border-warning/30 bg-warning/10 text-warning' },
    won: { label: 'فائز', classes: 'border-success/30 bg-success/10 text-success' },
    lost: { label: 'غير فائز', classes: 'border-text-secondary/30 bg-text-secondary/10 text-text-secondary' },
    submitted: { label: 'مُقدَّم', classes: 'border-success/30 bg-success/10 text-success' },
    accepted: { label: 'مقبول', classes: 'border-success/30 bg-success/10 text-success' },
    open: { label: 'مفتوح', classes: 'border-registry-green/30 bg-registry-green/10 text-registry-green' }
  };

  const current = config[status] || { label: status, classes: 'border-border bg-paper text-text-secondary' };

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-medium border rounded-full ${current.classes}`}>
      {current.label}
    </span>
  );
}
