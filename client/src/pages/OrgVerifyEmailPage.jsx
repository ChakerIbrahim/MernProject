/**
 * Organization email-verification page.
 * Sends the entered code to the server and lets the user request a new code.
 * A verified organization continues to the review notice, while an individual can enter its dashboard.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import FormField from '../components/FormField';
import Button from '../components/Button';
import PageHeading from '../components/PageHeading';
import PublicLayout from '../components/PublicLayout';
import Card from '../components/Card';
import Icon from '../components/Icon';

/**
 * Builds the email-verification form.
 * @returns {JSX.Element|null} The verification page, or null before redirecting when no email exists.
 */
export default function OrgVerifyEmailPage() {
    // Code typed by the user from the verification email.
    const [code, setCode] = useState('');
    // Error shown when verification or resend fails.
    const [error, setError] = useState('');
    // Success message shown after a new code is sent.
    const [notice, setNotice] = useState('');
    // Disables verification controls while the code request is running.
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Disables controls while a new code is being requested.
    const [isResending, setIsResending] = useState(false);

    // Authentication action used when an individual receives a token.
    const { login } = useAuth();
    // Router helpers used for redirects after verification.
    const navigate = useNavigate();
    const location = useLocation();
    // Email passed from the registration page through router state.
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    /**
     * Sends the verification code to the server and routes the user by role.
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
     * @returns {Promise<void>} Resolves after success or an error-state update.
     * @throws {Error} The Axios error is caught and displayed to the user.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code) {
            setError("الرجاء إدخال رمز التحقق");
            return;
        }

        setIsSubmitting(true);
        setError('');
        setNotice('');

        try {
            const res = await api.post('/api/auth/verify', { email, code });

            // The backend now returns the user and token if verification is successful.
            if (res.data.user && res.data.token) {
                if (res.data.user.role === 'individual') {
                    // Individuals are fully approved upon email verification
                    login(res.data.user, res.data.token);
                    navigate('/dashboard');
                } else {
                    // Organizations are still pending admin review
                    navigate('/register/organization/review');
                }
            } else {
                // Fallback just in case
                navigate('/register/organization/review');
            }
        } catch (err) {
            setError(err.response?.data?.error || "رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Requests a fresh verification code for the current email.
     * @returns {Promise<void>} Resolves after the notice or error is updated.
     * @throws {Error} The Axios error is caught and displayed to the user.
     */
    const handleResend = async () => {
        setIsResending(true);
        setError('');
        setNotice('');
        try {
            const response = await api.post('/api/auth/resend-verification', { email });
            setNotice(response.data.message || 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني');
        } catch (err) {
            setError(err.response?.data?.error || 'تعذّر إرسال رمز جديد. حاول مرة أخرى.');
        } finally {
            setIsResending(false);
        }
    };

    if (!email) return null;

    return (
        <PublicLayout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-paper">
                <div className="absolute inset-0 palestine-pattern opacity-10" aria-hidden="true" />

                <div className="w-full max-w-md relative z-10 motion-rise-in">
                    <Card className="p-6 sm:p-10 shadow-lg border-paper/50 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-registry-green/10 text-registry-green mb-6">
                            <Icon name="bell" className="h-8 w-8" />
                        </div>
                        <PageHeading title="تحقق من بريدك الإلكتروني" />
                        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                            لقد أرسلنا رمز تحقق إلى البريد الإلكتروني:<br/>
                            <bdi className="font-bold text-ink" dir="ltr">{email}</bdi>
                        </p>

                        {notice && <p className="mt-6 rounded-lg border border-success bg-success/5 p-4 text-start text-sm text-success" role="status">{notice}</p>}

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-error text-error rounded-lg text-sm flex gap-3 items-start text-start" role="alert">
                                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-start">
                            <FormField
                                id="code"
                                label="رمز التحقق (6 أرقام)"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setError('');
                                }}
                                dir="ltr"
                                className="text-center text-2xl tracking-widest font-mono tabular-nums"
                                placeholder="------"
                                required
                            />

                            <Button type="submit" variant="primary" className="w-full justify-center py-3 text-base" disabled={isSubmitting || isResending}>
                                {isSubmitting ? 'جاري التحقق...' : 'تأكيد الرمز'}
                            </Button>
                            <button type="button" onClick={handleResend} disabled={isSubmitting || isResending} className="w-full text-sm font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green disabled:cursor-not-allowed disabled:opacity-60">
                                {isResending ? 'جاري إرسال رمز جديد...' : 'إعادة إرسال الرمز'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border text-sm text-text-secondary">
                            <p>
                                هل أخطأت في البريد الإلكتروني؟ <Link to="/login" className="font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">العودة لتسجيل الدخول</Link>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}
