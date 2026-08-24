/**
 * Individual registration page.
 * Collects name, contact, password, and national-ID document data.
 * It validates the form, checks the document, and sends the registration request only after verification succeeds.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../functions/api';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import Button from '../components/Button';
import FileUploadField from '../components/FileUploadField';
import PageHeading from '../components/PageHeading';
import PublicLayout from '../components/PublicLayout';
import Card from '../components/Card';
import Icon from '../components/Icon';

/** Validation rules shared by the individual registration fields. */
const nameRegex = /^[\p{L}\s]{2,}$/u;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
const allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

/**
 * Validates one individual-registration field.
 * @param {string} id - Field name being checked.
 * @param {string} value - Current field value.
 * @param {object} values - All values used for password matching.
 * @returns {string} An Arabic error message, or an empty string when valid.
 */
function validateField(id, value, values) {
    const text = String(value || '').trim();
    if (id === 'firstName') {
        if (!text) return 'الاسم الأول مطلوب';
        if (!nameRegex.test(text)) return 'أدخل اسماً صحيحاً';
    }
    if (id === 'lastName') {
        if (!text) return 'اسم العائلة مطلوب';
        if (!nameRegex.test(text)) return 'أدخل اسماً صحيحاً';
    }
    if (id === 'email') {
        if (!text) return 'البريد الإلكتروني مطلوب';
        if (!emailRegex.test(text)) return 'أدخل بريداً إلكترونياً صالحاً';
    }
    if (id === 'phoneNumber') {
        if (!text) return 'رقم الهاتف مطلوب';
        if (!phoneRegex.test(text)) return 'أدخل رقم هاتف صالحاً من 7 إلى 15 رقماً';
    }
    if (id === 'password') {
        if (!value) return 'كلمة المرور مطلوبة';
        if (value.length < 8) return 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل';
    }
    if (id === 'confirmPassword') {
        if (!value) return 'تأكيد كلمة المرور مطلوب';
        if (value !== values.password) return 'كلمة المرور وتأكيدها غير متطابقين';
    }
    return '';
}

/**
 * Builds the individual registration form.
 * @returns {JSX.Element} The form, document-check state, and validation messages.
 */
export default function IndRegisterPage() {
    // Text values entered by the individual.
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    // Field errors displayed below the matching inputs.
    const [errors, setErrors] = useState({});
    // Disables the form while the account is being created.
    const [isSubmitting, setIsSubmitting] = useState(false);
    // National-ID file selected by the user.
    const [idDocument, setIdDocument] = useState(null);
    // Shows the document-analysis waiting state.
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Technical or service error from document analysis.
    const [aiError, setAiError] = useState('');
    // Explains why the submitted document was rejected.
    const [aiRejection, setAiRejection] = useState(null);

    const navigate = useNavigate();

    /**
     * Updates a field and validates it on every change.
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
     * @returns {void} Updates form values and related error messages.
     */
    const handleChange = (e) => {
        const { id, value } = e.target;
        const nextValues = { ...formData, [id]: value };
        setFormData(nextValues);

        setErrors((current) => {
            const next = { ...current };
            const fieldError = validateField(id, value, nextValues);
            if (fieldError) next[id] = fieldError;
            else delete next[id];
            if (id === 'password' && nextValues.confirmPassword) {
                const confirmError = validateField('confirmPassword', nextValues.confirmPassword, nextValues);
                if (confirmError) next.confirmPassword = confirmError;
                else delete next.confirmPassword;
            }
            return next;
        });
    };

    /**
     * Validates and stores the national-ID file selected by the user.
     * @param {React.ChangeEvent<HTMLInputElement>} e - File input event.
     * @returns {void} Updates document and document-error state.
     */
    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setAiError('');
        setAiRejection(null);

        if (!file) {
            setIdDocument(null);
            setErrors((current) => ({ ...current, idDocument: 'مستند الهوية مطلوب' }));
            return;
        }
        if (!allowedDocumentTypes.includes(file.type)) {
            setIdDocument(null);
            setErrors((current) => ({ ...current, idDocument: 'صيغة الملف غير مدعومة. ارفع PDF أو JPG أو PNG' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setIdDocument(null);
            setErrors((current) => ({ ...current, idDocument: 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)' }));
            return;
        }
        setIdDocument(file);
        setErrors((current) => {
            const next = { ...current };
            delete next.idDocument;
            return next;
        });
    };



    /**
     * Runs every field validation before document analysis starts.
     * @returns {boolean} True when all form and document fields are valid.
     */
    const validateForm = () => {
        const nextErrors = {};
        Object.keys(formData).forEach((field) => {
            const fieldError = validateField(field, formData[field], formData);
            if (fieldError) nextErrors[field] = fieldError;
        });
        if (!idDocument) nextErrors.idDocument = 'مستند الهوية مطلوب';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    /**
     * Analyzes the ID, compares returned names, then creates the account after success.
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
     * @returns {Promise<void>} Resolves after analysis, registration, or error updates.
     * @throws {Error} Axios errors are caught and shown in the form.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsAnalyzing(true);
        setErrors({});
        setAiError('');
        setAiRejection(null);

        let verification = null;
        const documentData = new FormData();
        documentData.append('idDocument', idDocument);

        try {
            const res = await api.post('/api/auth/analyze-id', documentData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            verification = res.data.aiVerification;

            if (verification) {
                const inputFirstName = formData.firstName.trim().toLowerCase();
                const inputLastName = formData.lastName.trim().toLowerCase();
                const aiFirstName = (verification.firstName || '').trim().toLowerCase();
                const aiLastName = (verification.lastName || '').trim().toLowerCase();

                const nameMatches = (aiFirstName && aiFirstName.includes(inputFirstName) || inputFirstName.includes(aiFirstName)) &&
                                    (aiLastName && aiLastName.includes(inputLastName) || inputLastName.includes(aiLastName));

                if (verification.isValid && !nameMatches) {
                    verification.isValid = false;
                    verification.notes = "الاسم المدخل لا يتطابق مع الاسم الموجود في الهوية.";
                }
            }
        } catch (err) {
            setIsAnalyzing(false);
            setAiError(err.response?.data?.error || 'تعذّر تحليل الهوية تلقائياً. يرجى المحاولة مرة أخرى.');
            return;
        }

        if (verification && !verification.isValid) {
            setIsAnalyzing(false);
            setAiRejection(verification.notes || 'تم رفض المستند لأنه غير واضح أو غير مطابق.');
            return;
        }

        setIsAnalyzing(false);
        setIsSubmitting(true);

        const submitData = new FormData();
        submitData.append('role', 'individual');
        submitData.append('name', `${formData.firstName.trim()} ${formData.lastName.trim()}`);
        submitData.append('email', formData.email.trim().toLowerCase());
        submitData.append('phoneNumber', formData.phoneNumber.trim());
        submitData.append('password', formData.password);
        submitData.append('proofDocument', idDocument);
        if (verification?.nationalId) submitData.append('nationalId', verification.nationalId);
        if (verification) submitData.append('aiVerification', JSON.stringify(verification));

        try {
            await api.post('/api/auth/register', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Direct to email verification instead of login
            navigate('/register/organization/verify', { state: { email: formData.email.trim().toLowerCase() } });
        } catch (err) {
            const serverErrors = err.response?.data?.errors || {};
            if (serverErrors.file && !serverErrors.idDocument) serverErrors.idDocument = serverErrors.file;
            setErrors(Object.keys(serverErrors).length ? serverErrors : { general: 'حدث خطأ غير متوقع أثناء التسجيل. يرجى المحاولة مرة أخرى.' });
            setFormData((previous) => ({ ...previous, password: '', confirmPassword: '' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-paper">
                <div className="absolute inset-0 palestine-pattern opacity-10" aria-hidden="true" />
                <div className="w-full max-w-md relative z-10 motion-rise-in">
                    <Card className="p-6 sm:p-8 shadow-lg border-paper/50">
                        <div className="text-center mb-8">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-registry-green/10 text-registry-green mb-4">
                                <Icon name="gavel" className="h-6 w-6" />
                            </div>
                            <PageHeading title="تسجيل فرد" />
                            <p className="text-text-secondary mt-2 text-sm">أنشئ حساباً وقم بتفعيله عبر البريد الإلكتروني للمشاركة في المزادات.</p>
                        </div>

                        {errors.general && (
                            <div className="mb-6 p-4 bg-red-50 border border-error text-error rounded-lg text-sm flex gap-3 items-start" role="alert">
                                <Icon name="bell" className="h-5 w-5 shrink-0 mt-0.5" />
                                <p>{errors.general}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-1" noValidate>
                            <fieldset disabled={isSubmitting || isAnalyzing} className="space-y-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField id="firstName" label="الاسم الأول" value={formData.firstName} onChange={handleChange} error={errors.firstName} isValid={formData.firstName.length > 0 && !errors.firstName} required />
                                    <FormField id="lastName" label="اسم العائلة" value={formData.lastName} onChange={handleChange} error={errors.lastName} isValid={formData.lastName.length > 0 && !errors.lastName} required />
                                </div>
                                <FormField id="email" label="البريد الإلكتروني" type="email" value={formData.email} onChange={handleChange} error={errors.email} isValid={formData.email.length > 0 && !errors.email} dir="ltr" className="text-start" placeholder="name@example.com" required />
                                <FormField id="phoneNumber" label="رقم الهاتف" type="tel" value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} isValid={formData.phoneNumber.length > 0 && !errors.phoneNumber} dir="ltr" className="text-start tabular-nums" placeholder="05XXXXXXXX" required />
                                <PasswordField id="password" label="كلمة المرور" value={formData.password} onChange={handleChange} error={errors.password} required />
                                <PasswordField id="confirmPassword" label="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />

                                <FileUploadField id="idDocument" label="مستند الهوية الوطنية" accept=".jpg,.jpeg,.png,.pdf" hint="الأنواع المدعومة: PDF, JPG, PNG. الحد الأقصى: 5 ميجابايت." error={errors.idDocument} onChange={handleFileChange} />

                                {aiError && <div className="rounded-lg border-s-4 border-s-warning bg-warning/10 p-3 text-sm text-ink" role="status">{aiError}</div>}

                                {aiRejection && (
                                    <div className="rounded-lg border p-4 text-sm border-error/30 bg-error/5" role="status">
                                        <div className="flex items-center gap-2 font-bold mb-2 text-ink">
                                            <Icon name="bell" className="h-5 w-5 text-error" />
                                            <span className="text-error">تم رفض المستند</span>
                                        </div>
                                        <p className="text-error font-semibold mt-2 text-xs bg-error/10 p-2 rounded">{aiRejection}</p>
                                        <p className="text-text-secondary text-xs mt-2">يرجى تصحيح المشكلة وإعادة رفع المستند للمحاولة مرة أخرى.</p>
                                    </div>
                                )}

                                {isAnalyzing && (
                                    <div className="rounded-lg border border-registry-green/30 bg-registry-green/5 p-4 text-sm text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Icon name="sparkles" className="h-6 w-6 text-registry-green animate-pulse" />
                                            <span className="font-bold text-registry-green">الذكاء الاصطناعي يقوم بمطابقة الهوية والبيانات...</span>
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" variant="primary" className="w-full mt-8 justify-center py-3 text-base" disabled={isSubmitting || isAnalyzing}>
                                    {isSubmitting ? 'جاري إرسال الطلب...' : 'تحليل الهوية وتسجيل الحساب'}
                                </Button>
                            </fieldset>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary">
                            <p>لديك حساب بالفعل؟ <Link to="/login" className="font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">سجل دخول</Link></p>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}
