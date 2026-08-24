/**
 * Organization registration page.
 * Collects representative, company, contact, password, and proof-document data.
 * It validates the form in the browser, uploads the document with Axios, and redirects
 * the user to email verification after a successful registration request.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../functions/api';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import FileUploadField from '../components/FileUploadField';
import Button from '../components/Button';
import PageHeading from '../components/PageHeading';
import PublicLayout from '../components/PublicLayout';
import Card from '../components/Card';
import Icon from '../components/Icon';

/**
 * Builds and controls the organization registration form.
 * @returns {JSX.Element} The registration form and its validation states.
 */
export default function OrgRegisterPage() {
    // All text fields entered by the organization representative.
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        phoneNumber: ''
    });
    // Proof document selected for upload.
    const [file, setFile] = useState(null);
    // Validation and server errors keyed by field name.
    const [errors, setErrors] = useState({});
    // Tracks fields the user has interacted with so valid styling is meaningful.
    const [touched, setTouched] = useState({});
    // Disables the form while the registration request is running.
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Upload percentage shown beside the progress bar.
    const [uploadProgress, setUploadProgress] = useState(0);

    // Router helper used to open the email-verification page.
    const navigate = useNavigate();

    /**
     * Validates one field using the current form values.
     * @param {string} id - Field identifier.
     * @param {string} value - Current field value.
     * @param {object} currentFormData - Form values used for cross-field checks.
     * @returns {string|null} An Arabic error message, or null when valid.
     */
    const validateField = (id, value, currentFormData) => {
        const trimmedValue = value.trim();

        switch (id) {
            case 'name':
                if (!trimmedValue) return 'اسم ممثل المؤسسة مطلوب';
                if (!/^[\p{L}\s]{3,}$/u.test(trimmedValue)) {
                    return 'يجب أن يتكون الاسم من 3 أحرف على الأقل ولا يحتوي على أرقام أو رموز';
                }
                break;
            case 'email':
                if (!trimmedValue) return 'البريد الإلكتروني مطلوب';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
                    return 'يرجى إدخال بريد إلكتروني صحيح';
                }
                break;
            case 'companyName':
                if (!trimmedValue) return 'اسم الشركة أو المؤسسة مطلوب';
                if (trimmedValue.length < 3) return 'يجب أن يتكون اسم الشركة من 3 أحرف على الأقل';
                break;
            case 'phoneNumber':
                if (!trimmedValue) return 'رقم الهاتف مطلوب';
                if (!/^\+?[0-9\s-]{7,15}$/.test(trimmedValue)) {
                    return 'يرجى إدخال رقم هاتف صحيح';
                }
                break;
            case 'password':
                if (!value) return 'كلمة المرور مطلوبة';
                if (value.length < 8) return 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل';
                break;
            case 'confirmPassword':
                if (!value) return 'تأكيد كلمة المرور مطلوب';
                if (value !== currentFormData.password) {
                    return 'كلمة المرور وتأكيد كلمة المرور غير متطابقين';
                }
                break;
            default:
                break;
        }
        return null;
    };

    /**
     * Updates a field and validates it immediately.
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
     * @returns {void} Updates form, touched, and error state.
     */
    const handleChange = (e) => {
        const { id, value } = e.target;
        const newFormData = { ...formData, [id]: value };
        setFormData(newFormData);
        setTouched({ ...touched, [id]: true });

        const fieldError = validateField(id, value, newFormData);

        setErrors(prev => ({
            ...prev,
            [id]: fieldError,
            // Re-validate confirmPassword if password changes
            ...(id === 'password' && touched.confirmPassword ? { confirmPassword: validateField('confirmPassword', newFormData.confirmPassword, newFormData) } : {})
        }));
    };

    /**
     * Marks a field as visited and validates it when focus leaves the field.
     * @param {React.FocusEvent<HTMLInputElement>} e - Input blur event.
     * @returns {void} Updates touched and error state.
     */
    const handleBlur = (e) => {
        const { id, value } = e.target;
        setTouched({ ...touched, [id]: true });
        setErrors(prev => ({ ...prev, [id]: validateField(id, value, formData) }));
    };

    /**
     * Stores the selected proof document and clears an old file error.
     * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event.
     * @returns {void} Updates the selected file state.
     */
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        // Clear file error when user selects a new file
        if (errors.file) {
            setErrors({ ...errors, file: null });
        }
    };

    /**
     * Validates the whole form, uploads the document, and starts email verification.
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
     * @returns {Promise<void>} Resolves after navigation or error-state updates.
     * @throws {Error} The Axios error is caught and shown below the form.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side courtesy checks (NFR-S8)
        let hasClientErrors = false;
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const err = validateField(key, formData[key], formData);
            if (err) {
                newErrors[key] = err;
                hasClientErrors = true;
            }
        });

        if (hasClientErrors) {
            setErrors(newErrors);
            setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
            return;
        }

        if (!file) {
            setErrors({ file: "مستند الإثبات مطلوب. يرجى إرفاق ملف." });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors({ file: "حجم الملف يتجاوز الحد الأقصى (5 ميجابايت). يرجى اختيار ملف أصغر." });
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setErrors({ file: "نوع الملف غير مدعوم. يرجى رفع صورة (JPG/PNG) أو ملف PDF." });
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setUploadProgress(10); // Initial progress

        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'confirmPassword') submitData.append(key, value);
        });
        submitData.append('role', 'organization');
        submitData.append('proofDocument', file);

        try {
            await api.post('/api/auth/register', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            // Route to the email verification page
            navigate('/register/organization/verify', { state: { email: formData.email } });

        } catch (err) {
            setErrors(err.response?.data?.errors || { general: "حدث خطأ غير متوقع أثناء التسجيل. يرجى المحاولة مرة أخرى." });
            // Clear password on failure per basic hygiene, preserve other inputs per NFR-U2
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setUploadProgress(0);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-paper">
                <div className="absolute inset-0 palestine-pattern opacity-10" aria-hidden="true" />

                <div className="w-full max-w-2xl relative z-10 motion-rise-in">
                    <Card className="p-6 sm:p-10 shadow-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-registry-green/10 text-registry-green mb-4">
                                <Icon name="building" className="h-6 w-6" />
                            </div>
                            <PageHeading title="تسجيل مؤسسة" />
                            <p className="text-text-secondary mt-2 text-sm">أنشئ حساباً لمؤسستك للبدء بطرح العطاءات والمشاركة في المزادات.</p>
                        </div>

                        {errors.general && (
                            <div className="mb-8 p-4 bg-red-50 border border-error text-error rounded-lg text-sm flex gap-3 items-start" role="alert">
                                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p>{errors.general}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <fieldset disabled={isSubmitting} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <FormField
                                        id="name"
                                        label="اسم ممثل المؤسسة"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={errors.name}
                                        isValid={touched.name && !errors.name && !validateField('name', formData.name, formData)}
                                        required
                                    />
                                    <FormField
                                        id="email"
                                        label="البريد الإلكتروني"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={errors.email}
                                        isValid={touched.email && !errors.email && !validateField('email', formData.email, formData)}
                                        dir="ltr"
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <FormField
                                        id="companyName"
                                        label="اسم الشركة أو المؤسسة"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={errors.companyName}
                                        isValid={touched.companyName && !errors.companyName && !validateField('companyName', formData.companyName, formData)}
                                        required
                                    />
                                    <FormField
                                        id="phoneNumber"
                                        label="رقم الهاتف"
                                        type="tel"
                                        inputMode="tel"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={errors.phoneNumber}
                                        isValid={touched.phoneNumber && !errors.phoneNumber && !validateField('phoneNumber', formData.phoneNumber, formData)}
                                        dir="ltr"
                                        className="tabular-nums"
                                        placeholder="0590000000"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <PasswordField
                                        id="password"
                                        label="كلمة المرور"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={errors.password}
                                        isValid={touched.password && !errors.password && !validateField('password', formData.password, formData)}
                                        required
                                    />
                                    <PasswordField
                                        id="confirmPassword"
                                        label="تأكيد كلمة المرور"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={errors.confirmPassword}
                                        isValid={touched.confirmPassword && !errors.confirmPassword && !validateField('confirmPassword', formData.confirmPassword, formData)}
                                        required
                                    />
                                </div>

                                <div className="border-t border-border pt-6">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-bold text-ink mb-1">الوثائق الرسمية</h3>
                                        <p className="text-xs text-text-secondary">تُستخدم هذه الوثيقة للتحقق من هوية المؤسسة قبل اعتماد الحساب.</p>
                                    </div>

                                    <FileUploadField
                                        id="proofDocument"
                                        label="مستند إثبات هوية المؤسسة"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        hint="الأنواع المدعومة: PDF, JPG, PNG. الحد الأقصى: 5 ميجابايت."
                                        error={errors.file}
                                        onChange={handleFileChange}
                                    />

                                    {file && !errors.file && (
                                        <div className="mt-2 flex items-center justify-between rounded-lg border border-registry-green/30 bg-registry-green/5 p-3 text-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Icon name="document" className="h-5 w-5 shrink-0 text-registry-green" />
                                                <span className="truncate font-medium text-registry-green" dir="ltr"><bdi>{file.name}</bdi></span>
                                            </div>
                                            <span className="shrink-0 text-xs text-text-secondary tabular-nums" dir="ltr">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                        </div>
                                    )}

                                    {isSubmitting && uploadProgress > 0 && (
                                        <div className="mt-4">
                                            <div className="mb-1 flex justify-between text-xs text-text-secondary">
                                                <span>جاري رفع المستند والتسجيل...</span>
                                                <span className="tabular-nums" dir="ltr">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
                                                <div
                                                    className="h-full bg-registry-green transition-all duration-300 ease-out"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" variant="primary" className="w-full mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-green-dark">
                                    {isSubmitting ? 'جاري إرسال الطلب...' : 'تسجيل حساب مؤسسة'}
                                </Button>
                            </fieldset>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary">
                            <p>
                                لديك حساب بالفعل؟ <Link to="/login" className="font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">سجل دخول</Link>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}
