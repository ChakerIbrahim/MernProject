const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const getTemplates = (env = process.env) => ({
    VERIFICATION: env.EMAILJS_VERIFICATION_TEMPLATE || 'template_ui7ifvr',
    GENERAL: env.EMAILJS_GENERAL_TEMPLATE || 'template_w1mnjin'
});

const buildEmailPayload = ({ templateType, to_email, to_name, subject, details, code }, env = process.env) => {
    const templates = getTemplates(env);
    const templateId = templates[templateType] || templates.GENERAL;
    const isVerificationTemplate = templateType === 'VERIFICATION';
    const notificationTitle = subject || (isVerificationTemplate ? 'رمز التحقق من البريد الإلكتروني' : 'إشعار من منصة اعتماد');
    const notificationIntro = details || (isVerificationTemplate ? 'استخدم الرمز التالي لإكمال عملية التحقق.' : 'لديك تحديث جديد من منصة اعتماد.');
    const notificationCode = code || '';

    return {
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
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
};

const hasEmailCredentials = (payload) => Boolean(
    payload.service_id && payload.user_id && payload.accessToken
);

exports.buildEmailPayload = buildEmailPayload;
exports.hasEmailCredentials = hasEmailCredentials;

exports.sendEmail = async (params, { env = process.env, fetchImpl = fetch } = {}) => {
    try {
        const payload = buildEmailPayload(params, env);

        if (!hasEmailCredentials(payload)) {
            console.error('EmailJS server credentials are not configured.');
            return false;
        }

        const response = await fetchImpl(EMAILJS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`EmailJS ${response.status}: ${responseText}`);
        }

        console.log(`Email sent successfully to ${params.to_email}`);
        return true;
    } catch (error) {
        console.error('Failed to send email via EmailJS API:', error.message);
        return false;
    }
};
