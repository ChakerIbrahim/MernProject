/**
 * Login page for all account roles.
 * Sends credentials through the shared Axios instance and routes the user by role or verification state.
 * It also shows loading, pending-review, success, and error messages.
 */
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import Button from '../components/Button';
import PageHeading from '../components/PageHeading';
import PublicLayout from '../components/PublicLayout';
import Icon from '../components/Icon';

/**
 * Builds the shared login form.
 * @returns {JSX.Element} The login form and its current status messages.
 */
export default function LoginPage() {
    // Credentials entered by the user.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Error returned by the login request.
    const [error, setError] = useState('');
    // Disables the form while authentication is running.
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Shows a short message while a pending organization is redirected.
    const [pendingNotice, setPendingNotice] = useState(false);

    // Authentication action that stores the returned user and token.
    const { login } = useAuth();
    // Router helpers used for role and verification redirects.
    const navigate = useNavigate();
    const location = useLocation();
    // Optional success message passed from another page.
    const successMessage = location.state?.message;

    /**
     * Authenticates the entered credentials and routes the user to the correct area.
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
     * @returns {Promise<void>} Resolves after login or an error-state update.
     * @throws {Error} The Axios error is caught and shown in the form.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setPendingNotice(false);

        try {
            const res = await api.post('/api/auth/login', { email, password });

            if (res.data.user.role === 'organization' && res.data.user.status === 'pending') {
                setPendingNotice(true);
                login(res.data.user, res.data.token);
                setTimeout(() => {
                    navigate('/org/dashboard');
                }, 2500);
                return;
            }

            login(res.data.user, res.data.token);

            const role = res.data.user.role;
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'organization') navigate('/org/dashboard');
            else navigate('/dashboard');

        } catch (err) {
            if (err.response?.data?.needsVerification) {
                // Now used by both organizations and individuals
                navigate('/register/organization/verify', { state: { email: err.response.data.email } });
            } else {
                setError(err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
                setPassword('');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-[calc(100vh-64px)] bg-paper px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
                <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-surface shadow-lg lg:grid-cols-2">
                    <aside className="relative min-h-[360px] overflow-hidden bg-ink text-surface lg:order-last lg:min-h-[680px]">
                        <img src="/landing-assets/palestine-business-collaboration.jpg" alt="فريق فلسطيني يتعاون حول فرصة عمل" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/10" aria-hidden="true" />
                        <div className="absolute inset-0 palestine-pattern opacity-20" aria-hidden="true" />
                        <div className="relative flex h-full flex-col justify-between p-7 sm:p-10">
                            <div className="flex items-center gap-3 text-sm font-bold text-paper/90">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-registry-green text-surface"><Icon name="olive" className="h-5 w-5" /></span>
                                اعتماد / مساحة السوق
                            </div>
                            <div className="max-w-md">
                                <p className="mb-4 text-sm font-bold text-paper/75">من الفكرة إلى الفرصة</p>
                                <h2 className="text-3xl font-bold leading-tight font-display sm:text-4xl">مكان واحد يعيد ترتيب خطواتك التجارية.</h2>
                                <p className="mt-4 leading-8 text-paper/80">سجّل دخولك لتتابع عروضك، مزاداتك، وتنبيهاتك من تجربة عربية مصممة للسوق الفلسطيني.</p>
                                <div className="mt-7 flex flex-wrap gap-3 text-xs text-paper/80">
                                    <span className="rounded-full border border-paper/25 bg-ink/25 px-3 py-2 backdrop-blur-sm">هوية موثوقة</span>
                                    <span className="rounded-full border border-paper/25 bg-ink/25 px-3 py-2 backdrop-blur-sm">متابعة واضحة</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="flex items-center p-7 sm:p-10 lg:p-14">
                        <div className="w-full motion-rise-in">
                            <div className="mb-8 text-start">
                                <div className="mb-4 flex items-center justify-start gap-3 text-sm font-bold text-registry-green">
                                    <span className="h-px w-10 bg-registry-green" />
                                    <span>مرحباً بعودتك</span>
                                </div>
                                <PageHeading title="تسجيل الدخول" />
                                <p className="mt-3 text-sm leading-7 text-text-secondary">أدخل بياناتك للوصول إلى مساحتك في اعتماد.</p>
                            </div>

                            {successMessage && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success-dark" role="status">
                                    <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" />
                                    <p>{successMessage}</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg border border-error bg-error/5 p-4 text-sm text-error" role="alert">
                                    <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p>{error}</p>
                                </div>
                            )}

                            {pendingNotice && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg border border-registry-green/30 bg-registry-green/5 p-4 text-sm text-green-dark motion-rise-in" role="alert">
                                    <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0" />
                                    <div>
                                        <p className="mb-1 font-bold">حسابك قيد المراجعة</p>
                                        <p>تم تسجيل الدخول بنجاح. سيتم توجيهك الآن إلى لوحة التحكم.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <FormField
                                    id="email"
                                    label="البريد الإلكتروني"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    dir="ltr"
                                    placeholder="name@example.com"
                                    required
                                />

                                <PasswordField
                                    id="password"
                                    label="كلمة المرور"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <Button type="submit" variant="primary" className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting || pendingNotice}>
                                    {isSubmitting || pendingNotice ? 'جاري الدخول...' : 'تسجيل الدخول'}
                                </Button>
                            </form>

                            <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text-secondary">
                                <p className="mb-3">ليس لديك حساب بعد؟</p>
                                <div className="flex justify-center gap-4">
                                    <Link to="/register/organization" className="font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">سجل كمؤسسة</Link>
                                    <span className="text-border">|</span>
                                    <Link to="/register/individual" className="font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">سجل كفرد</Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}
