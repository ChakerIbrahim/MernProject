export const formatDate = (value) => {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير محدد';
  return new Intl.DateTimeFormat('ar-PS', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export const formatMoney = (value) => {
  if (value === undefined || value === null || value === '') return 'غير محدد';
  return `${new Intl.NumberFormat('ar-PS').format(Number(value))} ₪`;
};

// Generic fallback if a domain-specific label is not needed
export const getStatusLabel = (status) => ({
  open: 'مفتوح',
  closed: 'مغلق',
  cancelled: 'ملغى',
  active: 'نشط',
  pending_approval: 'قيد المراجعة',
  ended: 'انتهى',
  submitted: 'مقدّم',
  under_review: 'قيد المراجعة',
  accepted: 'مقبول',
  rejected: 'مرفوض'
}[status] || status || 'غير محدد');

export const formatMessageTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};
