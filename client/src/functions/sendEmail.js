import emailjs from '@emailjs/browser';

export const sendNotification = async ({ notificationType, recipientEmail, recipientName, subject, details, code }) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('لم يتم إعداد بيانات EmailJS، تم تخطي الإشعار الإلكتروني.');
    return;
  }

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        notification_type: notificationType,
        to_email: recipientEmail,
        email: recipientEmail, // Added to match user's template variables
        to_name: recipientName,
        subject,
        details,
        code,
        reset_code: code,
        email_subject: subject,
        email_title: subject,
        intro_text: details,
        code_label: code ? 'رمز التحقق' : 'تنبيه المنصة',
        confirmation_code: code || '',
        expiry_text: code ? 'رمز التحقق صالح لمدة ساعة واحدة.' : 'يمكنك تسجيل الدخول إلى منصة اعتماد لمتابعة آخر التحديثات.',
        security_note: code ? 'لا تشارك رمز التحقق مع أي شخص.' : 'إذا لم تتوقع هذا الإشعار، يمكنك تجاهله.'
      },
      publicKey
    );
  } catch (error) {
    console.error('فشل إرسال إشعار EmailJS:', error);
  }
};
