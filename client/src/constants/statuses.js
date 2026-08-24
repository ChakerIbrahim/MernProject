export const TENDER_STATUS_LABELS = {
  open: 'مفتوح',
  closed: 'مغلق',
  cancelled: 'ملغى'
};

export const AUCTION_STATUS_LABELS = {
  active: 'نشط',
  pending_approval: 'قيد المراجعة',
  ended: 'انتهى',
  cancelled: 'ملغى'
};

export const PROPOSAL_STATUS_LABELS = {
  submitted: 'مقدّم',
  under_review: 'قيد المراجعة',
  accepted: 'مقبول',
  rejected: 'مرفوض'
};

export const ACCOUNT_STATUS_CONTENT = {
  pending_verification: {
    title: 'أكمل التحقق من البريد الإلكتروني',
    message: 'تحقق من بريدك الإلكتروني باستخدام الرمز المرسل إليك حتى يبدأ فريق اعتماد مراجعة الطلب.',
    action: { label: 'متابعة التحقق', to: '/register/organization/verify' },
    tone: 'warning'
  },
  pending: {
    title: 'حساب المؤسسة قيد المراجعة',
    message: 'تم استلام بيانات المؤسسة. لا يمكنك إنشاء عطاء أو مزاد حتى يكتمل الاعتماد، وستصلك رسالة عند انتهاء المراجعة.',
    action: null,
    tone: 'warning'
  },
  rejected: {
    title: 'يحتاج طلب المؤسسة إلى تحديث',
    message: 'راجع الملاحظات المرسلة إلى بريدك الإلكتروني ثم أعد تقديم البيانات أو المستندات المطلوبة.',
    action: { label: 'إعادة تقديم الطلب', to: '/org/profile' },
    tone: 'error'
  },
  incomplete: {
    title: 'حالة الحساب غير مكتملة',
    message: 'أكمل بيانات المؤسسة حتى تتمكن من استخدام أدوات التوريد والمزادات.',
    action: { label: 'استكمال ملف المؤسسة', to: '/org/profile' },
    tone: 'warning'
  }
};
