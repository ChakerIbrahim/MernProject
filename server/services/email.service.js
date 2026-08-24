const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const TEMPLATES = {
    VERIFICATION: process.env.EMAILJS_VERIFICATION_TEMPLATE || 'template_ui7ifvr',
    GENERAL: process.env.EMAILJS_GENERAL_TEMPLATE || 'template_w1mnjin'
};

exports.sendEmail = async ({ templateType, to_email, to_name, subject, details, code }) => {
    try {
        const templateId = TEMPLATES[templateType] || TEMPLATES.GENERAL;
        const isVerificationTemplate = templateType === 'VERIFICATION';
        const notificationTitle = subject || (isVerificationTemplate ? 'رمز التحقق من البريد الإلكتروني' : 'إشعار من منصة اعتماد');
        const notificationIntro = details || (isVerificationTemplate ? 'استخدم الرمز التالي لإكمال عملية التحقق.' : 'لديك تحديث جديد من منصة اعتماد.');
        const notificationCode = code || '';

        const payload = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: templateId,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email,
                to_name,
                subject,
                details,
                code,
                reset_code: code,
                email: to_email,
                email_subject: notificationTitle,
                email_title: notificationTitle,
                intro_text: notificationIntro,
                code_label: isVerificationTemplate ? 'رمز التحقق' : 'تنبيه المنصة',
                confirmation_code: notificationCode,
                expiry_text: isVerificationTemplate ? 'رمز التحقق صالح لمدة ساعة واحدة.' : 'يمكنك تسجيل الدخول إلى منصة اعتماد لمتابعة آخر التحديثات.',
                security_note: isVerificationTemplate ? 'لا تشارك رمز التحقق مع أي شخص.' : 'إذا لم تتوقع هذا الإشعار، يمكنك تجاهله.'
            }
        };

        if (!payload.service_id || !payload.user_id || !payload.accessToken) {
            console.error('EmailJS server credentials are not configured.');
            return false;
        }

        const response = await fetch(EMAILJS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`EmailJS ${response.status}: ${responseText}`);
        }

        console.log(`Email sent successfully to ${to_email}`);
        return true;
    } catch (error) {
        console.error('Failed to send email via EmailJS API:', error.message);
        return false;
    }
};
