/**
 * Tender details page.
 * Loads one tender and shows its details, documents, proposal actions, and owner/admin controls.
 * It also handles proposal upload, AI analysis, proposal decisions, and loading/error states.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../functions/api';
import { useAuth } from '../components/AuthContext';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import StatusStamp from '../components/StatusStamp';
import { formatMoney, getStatusLabel, formatDate } from '../functions/formatters';
import Button from '../components/Button';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import { sendNotification } from '../functions/sendEmail';
import Breadcrumbs from '../components/Breadcrumbs';
import DataRail from '../components/DataRail';
import Countdown from '../components/Countdown';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploadField from '../components/FileUploadField';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ConfidenceBadge from '../components/ConfidenceBadge';
import ResponsiveTable from '../components/ResponsiveTable';
import AnalysisDetailsModal from '../components/AnalysisDetailsModal';
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * Reads an ID from either a populated object or a plain ID.
 * @param {object|string|null} entity - Object or ID returned by the API.
 * @returns {string|undefined} The usable ID value.
 */
const getEntityId = (entity) => entity?._id || entity?.id || entity;

/**
 * Converts a decimal confidence value to a percentage when needed.
 * @param {number|string} value - Confidence value from the AI response.
 * @returns {number} Confidence expressed from 0 to 100.
 */
function normalizePercent(value) {
    const score = Number(value || 0);
    return score > 0 && score <= 1 ? score * 100 : score;
}

/**
 * Builds the tender details and proposal-management page.
 * @returns {JSX.Element} Loading, error, tender, proposal, or review UI.
 */
export default function TenderDetailPage() {
    // Tender ID taken from the current route.
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Tender data loaded from the server.
    const [tender, setTender] = useState(null);
    // Controls the main page spinner.
    const [isLoading, setIsLoading] = useState(true);
    // Main tender-loading error message.
    const [error, setError] = useState("");

    // Actions state
    const [isClosing, setIsClosing] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [decisionConfirm, setDecisionConfirm] = useState(null); // { id, status }

    // Proposals state
    // Proposals visible to the tender owner or an administrator.
    const [proposals, setProposals] = useState([]);
    // Loading flag for the proposal list.
    const [isProposalsLoading, setIsProposalsLoading] = useState(false);
    // Error shown when the proposal list cannot be loaded.
    const [proposalsError, setProposalsError] = useState("");

    // My existing proposal state
    // Existing proposal submitted by the current organization, if one exists.
    const [myProposal, setMyProposal] = useState(null);
    // Prevents duplicate checks from appearing as a blank submission state.
    const [isCheckingMyProposal, setIsCheckingMyProposal] = useState(false);

    // Submit proposal state
    const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
    const [proposalFile, setProposalFile] = useState(null);
    const [finalPrice, setFinalPrice] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [submitNotice, setSubmitNotice] = useState("");
    const [submitFieldErrors, setSubmitFieldErrors] = useState({});

    // AI Analysis state
    // Controls analysis loading for a new or existing proposal.
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Current visual stage of the analysis progress dialog.
    const [aiProgressStage, setAiProgressStage] = useState(0);
    const [aiData, setAiData] = useState(null);
    const [analyzingProposalId, setAnalyzingProposalId] = useState(null);
    const [proposalAnalysisErrors, setProposalAnalysisErrors] = useState({});
    const [aiError, setAiError] = useState("");
    const [showReviewStep, setShowReviewStep] = useState(false);

    // Modal state for viewing AI details
    const [viewingAnalysisData, setViewingAnalysisData] = useState(null);
    const [viewingAnalysisCompany, setViewingAnalysisCompany] = useState("");

    /**
     * Loads the tender connected to the current route.
     * @returns {Promise<void>} Updates tender or error state.
     * @throws {Error} The Axios error is caught and shown on the page.
     */
    const fetchTender = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await api.get(`/api/tenders/${id}`);
            setTender(res.data.tender);
        } catch (err) {
            setError(err.response?.data?.error || "تعذّر تحميل العطاء. تأكد من صحة الرابط.");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Loads proposals when the current user owns the tender or is an admin.
     * @returns {Promise<void>} Updates proposals or proposal-error state.
     * @throws {Error} The Axios error is caught and shown above the list.
     */
    const fetchProposals = async () => {
        const isOwner = user?.role === 'organization' && getEntityId(tender?.createdBy) === getEntityId(user);
        const isAdmin = user?.role === 'admin';
        if (!isOwner && !isAdmin) return;

        setIsProposalsLoading(true);
        setProposalsError("");
        try {
            const res = await api.get(`/api/tenders/${id}/proposals`);
            setProposals(res.data.proposals);
        } catch (err) {
            setProposalsError("تعذّر تحميل العروض.");
        } finally {
            setIsProposalsLoading(false);
        }
    };

    /**
     * Checks whether the current approved organization already submitted a proposal.
     * @returns {Promise<void>} Updates the existing-proposal state when found.
     * @throws {Error} The Axios error is intentionally caught for a silent fallback.
     */
    const checkMyProposal = async () => {
        // Only check if user is an approved organization and not the owner
        const isEligibleOrg = user?.role === 'organization' && user?.status === 'approved';
        const isOwner = getEntityId(tender?.createdBy) === getEntityId(user);

        if (!isEligibleOrg || isOwner) return;

        setIsCheckingMyProposal(true);
        try {
            // Use the newly added endpoint from Sprint 16 to find if we already submitted
            const res = await api.get('/api/users/me/proposals');
            const existing = res.data.proposals.find(p => p.tender?._id === id);
            if (existing) {
                setMyProposal(existing);
            }
        } catch (err) {
            // Silently fail, they just won't see the duplicate guard and will hit the server 400 instead
            console.error("Failed to check existing proposals", err);
        } finally {
            setIsCheckingMyProposal(false);
        }
    };

    useEffect(() => {
        fetchTender();
    }, [id]);

    useEffect(() => {
        if (tender && user) {
            fetchProposals();
            checkMyProposal();
        }
    }, [tender, user]);

    /**
     * Closes the tender after the owner or admin confirms the action.
     * @returns {Promise<void>} Refreshes the tender or shows an alert on failure.
     * @throws {Error} The Axios error is caught and displayed in an alert.
     */
    const handleClose = async () => {
        setIsClosing(true);
        try {
            await api.delete(`/api/tenders/${id}`);
            setShowCloseConfirm(false);
            fetchTender();
        } catch (err) {
            alert(err.response?.data?.error || "حدث خطأ أثناء إغلاق العطاء");
            setShowCloseConfirm(false);
        } finally {
            setIsClosing(false);
        }
    };

    /**
     * Stores a selected proposal document and resets old analysis state.
     * @param {React.ChangeEvent<HTMLInputElement>} e - File input event.
     * @returns {void} Updates document and review state.
     */
    const handleFileChange = (e) => {
        setProposalFile(e.target.files[0]);
        setAiData(null);
        setAiError("");
        setSubmitNotice("");
        setShowReviewStep(false);
        setSubmitFieldErrors({});
    };

    /**
     * Uploads a new proposal document for AI extraction.
     * @returns {Promise<void>} Updates extracted data or manual-review state.
     * @throws {Error} The Axios error is caught and shown as an analysis message.
     */
    const handleAnalyzeDocument = async () => {
        if (!proposalFile) {
            setSubmitFieldErrors({ document: "مستند العرض مطلوب" });
            return;
        }

        if (proposalFile.size > 5 * 1024 * 1024) {
            setSubmitFieldErrors({ document: "حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)" });
            return;
        }

        setIsAnalyzing(true);
        setAiProgressStage(1);
        setAiError("");
        setSubmitFieldErrors({});

        const formData = new FormData();
        formData.append('document', proposalFile);

        // Progress stage simulation while real request runs
        const stageInterval = setInterval(() => {
            setAiProgressStage(current => current < 4 ? current + 1 : current);
        }, 1500);

        try {
            const res = await api.post(`/api/proposals/${id}/analyze`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAiData(res.data.aiExtractedData);
            setFinalPrice(res.data.aiExtractedData.extractedPrice?.toString() || "");
            setShowReviewStep(true);
        } catch (err) {
            setAiError(err.response?.data?.error || "تعذّر تحليل المستند تلقائياً، يمكنك إدخال السعر يدوياً");
            setShowReviewStep(true);
        } finally {
            clearInterval(stageInterval);
            setIsAnalyzing(false);
            setAiProgressStage(0);
        }
    };

    /**
     * Submits the reviewed proposal and its final price to the server.
     * @param {React.FormEvent<HTMLFormElement>} e - Proposal form submit event.
     * @returns {Promise<void>} Updates success, proposal, or validation state.
     * @throws {Error} The Axios error is caught and mapped to page errors.
     */
    const handleProposalSubmit = async (e) => {
        e.preventDefault();

        if (!finalPrice) {
            setSubmitFieldErrors({ finalPrice: "السعر النهائي مطلوب" });
            return;
        }

        setIsSubmittingProposal(true);
        setSubmitError("");
        setSubmitNotice("");

        const formData = new FormData();
        formData.append('document', proposalFile);
        formData.append('finalPrice', finalPrice);
        if (aiData) {
            formData.append('aiExtractedData', JSON.stringify(aiData));
        }

        try {
            const res = await api.post(`/api/tenders/${id}/proposals`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmitNotice("تم تقديم العرض بنجاح.");
            setShowReviewStep(false);
            setProposalFile(null);
            setFinalPrice("");
            setAiData(null);

            // Update UI immediately with the new proposal
            setMyProposal(res.data.proposal);

        } catch (err) {
            if (err.response?.data?.errors) {
                setSubmitFieldErrors(err.response.data.errors);
            } else {
                setSubmitError(err.response?.data?.error || "حدث خطأ أثناء تقديم العرض");
            }
        } finally {
            setIsSubmittingProposal(false);
        }
    };

    /**
     * Requests AI analysis for an existing proposal owned by the current tender.
     * @param {string} proposalId - Proposal ID to analyze.
     * @returns {Promise<void>} Updates that proposal with the analysis result.
     * @throws {Error} The Axios error is caught in the row-specific error state.
     */
    const handleAnalyzeExistingProposal = async (proposalId) => {
        setAnalyzingProposalId(proposalId);
        setAiProgressStage(1);
        setProposalAnalysisErrors((current) => ({ ...current, [proposalId]: '' }));

        // Keep the shared progress UI moving while the real server analysis request runs.
        const stageInterval = setInterval(() => {
            setAiProgressStage((current) => current < 4 ? current + 1 : current);
        }, 1500);

        try {
            const res = await api.post(`/api/proposals/${proposalId}/review-ai`);
            setProposals((current) => current.map((proposal) => proposal._id === proposalId ? { ...proposal, aiExtractedData: res.data.aiExtractedData } : proposal));
        } catch (err) {
            setProposalAnalysisErrors((current) => ({ ...current, [proposalId]: err.response?.data?.error || 'تعذّر تحليل العرض حالياً.' }));
        } finally {
            clearInterval(stageInterval);
            setAnalyzingProposalId(null);
            setAiProgressStage(0);
        }
    };

    /**
     * Applies the confirmed accepted or rejected status to a proposal.
     * @returns {Promise<void>} Updates the proposal list and sends a notification when possible.
     * @throws {Error} The Axios error is caught and shown in an alert.
     */
    const handleProposalDecision = async () => {
        if (!decisionConfirm) return;
        const { id: proposalId, status } = decisionConfirm;

        try {
            await api.patch(`/api/proposals/${proposalId}/status`, { status });
            const proposal = proposals.find((item) => item._id === proposalId);

            // Update the specific row in place without refetching
            setProposals(proposals.map(p => p._id === proposalId ? { ...p, status } : p));

            if (proposal?.submittedBy?.email) {
                void sendNotification({
                    notificationType: status === 'accepted' ? 'proposal_accepted' : 'proposal_rejected',
                    recipientEmail: proposal.submittedBy.email,
                    recipientName: proposal.submittedBy.companyName || proposal.submittedBy.name,
                    subject: status === 'accepted' ? 'تم قبول عرضكم' : 'تم رفض عرضكم',
                    details: status === 'accepted' ? `تم قبول عرضكم على العطاء: ${tender.title}` : `تم رفض عرضكم على العطاء: ${tender.title}`
                });
            }
        } catch (err) {
            alert(err.response?.data?.error || "حدث خطأ أثناء تغيير حالة العرض");
        } finally {
            setDecisionConfirm(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper p-4">
                <Spinner label="جاري تحميل بيانات العطاء..." />
            </div>
        );
    }

    if (error || !tender) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center bg-paper p-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
                    <Icon name="document" className="h-8 w-8" />
                </div>
                <h1 className="mb-2 font-display text-2xl font-bold text-ink">هذا العطاء غير موجود</h1>
                <p className="mb-6 text-text-secondary">{error || "العطاء الذي تبحث عنه غير موجود أو تم حذفه."}</p>
                <Link to="/tenders">
                    <Button variant="primary">العودة لقائمة العطاءات</Button>
                </Link>
            </div>
        );
    }

    const isOwner = user?.role === 'organization' && getEntityId(tender.createdBy) === getEntityId(user);
    const isAdmin = user?.role === 'admin';
    const isApprovedOrg = user?.role === 'organization' && user?.status === 'approved';
    const canEdit = isOwner && tender.status === 'open';
    const canClose = (isOwner || isAdmin) && tender.status === 'open';
    const deadlineDate = new Date(tender.deadline);
    const isPastDeadline = deadlineDate < new Date();

    // Render the correct submit panel variant
    const renderSubmitPanel = () => {
        if (isAdmin) return null;

        if (isOwner) {
            return null; // The owner does not need a large submit panel, they have the proposals list
        }

        if (user?.role === 'individual' || (user?.role === 'organization' && user?.status !== 'approved')) {
            return (
                <div className="rounded-[16px] border border-border bg-surface p-6 text-center shadow-sm">
                    <Icon name="shield" className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
                    <h3 className="mb-2 font-display text-[18px] font-bold text-ink">تقديم العروض غير متاح</h3>
                    <p className="text-[14px] text-text-secondary">
                        {user?.role === 'individual'
                            ? "تقديم العروض متاح للمؤسسات المعتمدة فقط. بصفتك فرد، يمكنك المشاركة في المزادات."
                            : "حساب مؤسستك قيد المراجعة حالياً. لا يمكنك تقديم عروض حتى يتم اعتماد الحساب رسمياً."}
                    </p>
                </div>
            );
        }

        const handleRequestChat = async () => {
            try {
                await api.post(`/api/tenders/${id}/chat-requests`);
                alert('تم إرسال طلب المحادثة بنجاح.');
            } catch (err) {
                alert(err.response?.data?.error || 'تعذّر إرسال طلب المحادثة.');
            }
        };

        if (myProposal) {
            return (
                <div className="rounded-[16px] border border-success/30 bg-success/5 p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Icon name="document" className="h-6 w-6 text-success" />
                            <h3 className="font-display text-[18px] font-bold text-ink">لقد قمت بتقديم عرض مسبقاً</h3>
                        </div>
                        <StatusStamp status={myProposal.status} label={getStatusLabel(myProposal.status)} />
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-success/20 pt-4 text-[14px] text-text-secondary">
                        <span>السعر المقدّم: <bdi className="font-bold text-ink tabular-nums" dir="ltr">{formatMoney(myProposal.finalPrice)}</bdi></span>
                        <Link to={`/proposals/${myProposal._id}`} className="font-semibold text-registry-green hover:underline">
                            عرض تفاصيل عرضي
                        </Link>
                    </div>
                </div>
            );
        }

        if (tender.status !== 'open' || isPastDeadline) {
            return (
                <div className="rounded-[16px] border border-border bg-surface p-6 text-center shadow-sm">
                    <Icon name="bell" className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
                    <h3 className="mb-2 font-display text-[18px] font-bold text-ink">العطاء مغلق</h3>
                    <p className="text-[14px] text-text-secondary">هذا العطاء لم يعد مفتوحاً لتقديم العروض.</p>
                </div>
            );
        }

        // Active submission form
        return (
            <div className="rounded-[16px] border border-border bg-surface p-6 shadow-sm sm:p-7">
                <h2 className="mb-6 font-display text-[18px] font-bold text-ink">تقديم عرض</h2>

                {submitError && (
                    <div className="mb-4 flex items-start gap-3 rounded-lg border border-error bg-red-50 p-4 text-sm text-error" role="alert">
                        <Icon name="bell" className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>{submitError}</p>
                    </div>
                )}

                {submitNotice && (
                    <div className="mb-4 rounded-lg border border-success bg-surface p-4 text-sm text-success" role="status">
                        {submitNotice}
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-3 rounded-xl border border-registry-green/20 bg-registry-green/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-ink">لديك استفسار قبل تقديم العرض؟</h3>
                        <p className="text-xs text-text-secondary mt-1">يمكنك طلب محادثة مباشرة مع الجهة الطارحة للاستفسار عن تفاصيل العطاء.</p>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleRequestChat} className="shrink-0 text-registry-green border-registry-green/30 hover:bg-registry-green/10">طلب محادثة</Button>
                </div>

                <div className="space-y-6">
                    <FileUploadField
                        id="document"
                        label="مستند العرض (فني ومالي)"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="الأنواع المدعومة: PDF, JPG, PNG. الحد الأقصى: 5 ميجابايت."
                        error={submitFieldErrors.document}
                        onChange={handleFileChange}
                    />

                    {!showReviewStep && (
                        <Button type="button" variant="primary" className="w-full justify-center py-3" onClick={handleAnalyzeDocument} disabled={isAnalyzing || !proposalFile}>
                            {isAnalyzing ? 'جاري التحليل واستخراج البيانات...' : 'تحليل المستند والمتابعة'}
                        </Button>
                    )}

                    {showReviewStep && (
                        <div className="mt-6 rounded-[16px] border border-border bg-surface p-5 shadow-sm sm:p-8">
                            <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="font-display text-lg font-bold text-ink">بيانات مستخرجة (للمراجعة)</h2>
                                    <p className="mt-1 text-[13px] text-text-secondary">تم استخراج السعر والملخص من العرض المرفق. عدّله يدوياً إذا كان غير دقيق.</p>
                                </div>
                                {aiData && (
                                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
                                        ثقة التحليل: {aiData.confidenceScore > 0 && aiData.confidenceScore <= 1 ? aiData.confidenceScore * 100 : aiData.confidenceScore || 0}%
                                    </span>
                                )}
                            </div>

                            {proposalFile && (
                                <div className="mb-6 inline-block rounded-md bg-paper px-2.5 py-1 text-[12px] text-text-secondary">
                                    المصدر: <bdi dir="ltr">{proposalFile.name}</bdi>
                                </div>
                            )}

                            {aiError && (
                                <div className="mb-6 rounded-lg border-s-4 border-s-warning bg-warning/10 p-4 text-[13px] text-ink" role="status">
                                    <p className="font-bold">ملاحظة حول التحليل</p>
                                    <p className="mt-1">{aiError}</p>
                                </div>
                            )}

                            {aiData?.summary && (
                                <div className="mb-6 rounded-lg border border-border bg-paper p-4 text-[14px] leading-[1.8] text-ink">
                                    {aiData.summary}
                                </div>
                            )}

                            <form onSubmit={handleProposalSubmit} noValidate>
                                <div className="mb-5 flex flex-col gap-1.5">
                                    <label htmlFor="finalPrice" className="text-[13px] font-semibold text-ink">السعر النهائي (₪)</label>
                                    <input
                                        id="finalPrice"
                                        type="number"
                                        min="0"
                                        dir="ltr"
                                        value={finalPrice}
                                        onChange={(e) => setFinalPrice(e.target.value)}
                                        required
                                        className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-start text-[14px] text-ink tabular-nums transition-all focus:outline-none focus:ring-1 ${submitFieldErrors.finalPrice ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`}
                                    />
                                    {submitFieldErrors.finalPrice ? <p className="text-xs text-error">{submitFieldErrors.finalPrice}</p> : null}
                                </div>

                                <div className="mt-8 flex flex-col-reverse items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
                                    <button type="button" onClick={() => setShowReviewStep(false)} className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-border hover:bg-paper sm:w-auto">
                                        إلغاء
                                    </button>
                                    <button type="submit" disabled={isSubmittingProposal} className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-transparent bg-registry-green px-5 py-2.5 text-[14px] font-semibold text-surface shadow-sm transition-all hover:bg-green-dark hover:shadow-lg hover:shadow-registry-green/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none sm:w-auto">
                                        {isSubmittingProposal ? 'جاري التقديم...' : 'تأكيد وتقديم العرض'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const railItems = [
        { label: 'الفئة', value: tender.category || 'عام' },
        { label: 'الميزانية التقديرية', value: formatMoney(tender.budgetEstimate), tabular: true, ltr: true },
        { label: 'الجهة الطارحة', value: tender.createdBy?.companyName || 'غير متوفر' },
        {
            label: 'الموعد النهائي',
            value: <span className={`inline-block rounded-md px-2 py-0.5 text-[12.5px] font-bold tabular-nums ${isPastDeadline ? 'bg-error/10 text-error' : 'bg-registry-green/10 text-registry-green'}`} dir="ltr">
                <Countdown endsAt={tender.deadline} />
            </span>
        }
    ];

    const renderAiLoadingModal = () => {
        const isProposalReview = Boolean(analyzingProposalId);
        if (!isAnalyzing && !isProposalReview) return null;

        const stages = isProposalReview
            ? [
                { num: 1, label: 'قراءة وتحليل مستند العرض' },
                { num: 2, label: 'مقارنة العرض مع شروط العطاء' },
                { num: 3, label: 'تقييم الحقول ذات الأولوية' },
                { num: 4, label: 'تجهيز نتيجة التقييم' }
            ]
            : [
                { num: 1, label: 'قراءة وتحليل العرض الفني والمالي' },
                { num: 2, label: 'استخراج السعر الإجمالي' },
                { num: 3, label: 'تلخيص البنود الرئيسية' },
                { num: 4, label: 'تجهيز نموذج المراجعة' }
            ];

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
                <div className="relative w-full max-w-[470px] overflow-hidden rounded-3xl bg-surface px-6 pb-7 pt-9 text-center shadow-2xl">
                    <div className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />
                    <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-registry-green/70 border-t-registry-green opacity-80 [animation:ai-spin_1.15s_cubic-bezier(.55,.05,.35,.95)_infinite]" />
                        <div className="absolute inset-2.5 rounded-full border-2 border-transparent border-l-registry-green/10 border-r-registry-green border-t-registry-green/30 [animation:ai-spin-reverse_1.8s_linear_infinite]" />
                        <div className="absolute inset-5 rounded-full border border-dashed border-registry-green/40 [animation:ai-spin_5s_linear_infinite]" />
                        <div className="absolute top-1 start-8 h-2 w-2 rounded-full bg-registry-green/60 shadow-lg shadow-registry-green/20 [animation:ai-float-1_2.2s_ease-in-out_infinite]" />
                        <div className="absolute top-16 end-1 h-1.5 w-1.5 rounded-full bg-registry-green/60 shadow-lg shadow-registry-green/20 [animation:ai-float-2_2.6s_ease-in-out_infinite]" />
                        <div className="absolute bottom-3 start-4 h-1.5 w-1.5 rounded-full bg-registry-green/60 shadow-lg shadow-registry-green/20 [animation:ai-float-3_2.4s_ease-in-out_infinite]" />
                        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-registry-green to-green-dark text-surface shadow-lg [animation:ai-core-pulse_1.8s_ease-in-out_infinite]">
                            <Icon name="sparkle" className="h-7 w-7" />
                        </div>
                    </div>
                    <h2 id="ai-modal-title" className="mb-2 font-display text-lg font-bold text-ink">{isProposalReview ? 'جاري تحليل العرض' : 'جاري تحليل مستند العرض'}</h2>
                    <p className="mx-auto mb-6 max-w-xs text-xs leading-relaxed text-text-secondary">{isProposalReview ? 'يقارن الذكاء الاصطناعي العرض مع متطلبات العطاء والحقول ذات الأولوية لإعداد درجة توافق واضحة.' : 'الذكاء الاصطناعي يقرأ العرض الفني والمالي لاستخراج السعر والملخص. قد تستغرق العملية بضع لحظات.'}</p>
                    <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                        <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-registry-green/60 to-registry-green [animation:ai-progress_4.2s_ease-in-out_forwards]" />
                    </div>
                    <div className="flex flex-col gap-2.5 text-start">
                        {stages.map((stage) => {
                            const isActive = aiProgressStage === stage.num;
                            const isDone = aiProgressStage > stage.num;
                            return (
                                <div key={stage.num} className={`flex items-center gap-2.5 text-xs ${isActive || isDone ? 'font-bold text-ink' : 'text-text-secondary'}`}>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${isDone ? 'border-registry-green bg-registry-green text-surface' : isActive ? 'border-registry-green text-registry-green [animation:ai-blink_1s_infinite]' : 'border-border'}`}>
                                        {isDone ? <Icon name="check" className="h-3 w-3" /> : stage.num}
                                    </span>
                                    <span className={isDone ? 'text-registry-green' : ''}>{stage.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-5 border-t border-border pt-4 text-[10px] text-text-secondary">{isProposalReview ? 'سيتم حفظ نتيجة التقييم مع العرض بعد اكتمال التحليل.' : 'يمكنك مراجعة وتعديل السعر قبل التقديم النهائي.'}</div>
                </div>
            </div>
        );
    };

    return (
        <>
        {renderAiLoadingModal()}
        <div className="mx-auto w-full max-w-[1200px]" dir="rtl">
            <nav className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[13px] text-text-secondary" aria-label="مسار التنقل">
                <Link to="/tenders" className="hover:text-registry-green">العطاءات المفتوحة</Link>
                <span className="text-[11px] text-border" aria-hidden="true">‹</span>
                <span className="font-semibold text-ink">{tender.title}</span>
            </nav>

            <div className="mb-8 flex flex-col gap-5 rounded-[16px] border border-border bg-surface p-6 shadow-sm md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                    <h1 className="mb-1.5 font-display text-[22px] font-bold leading-[1.4] text-ink sm:text-[24px]">
                        {tender.title}
                    </h1>
                    <div className="mt-3 flex items-center gap-3">
                        <StatusStamp status={tender.status} label={getStatusLabel(tender.status)} />
                        <span className="text-[13px] text-text-secondary tabular-nums" dir="ltr">
                            {formatDate(tender.createdAt)}
                        </span>
                    </div>
                </div>

                {(canEdit || canClose) && (
                    <div className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-auto sm:flex-row">
                        {canEdit && (
                            <Link to={`/tenders/${id}/edit`} className="w-full sm:w-auto">
                                <Button variant="secondary" className="w-full justify-center text-[14px]">تعديل العطاء</Button>
                            </Link>
                        )}
                        {canClose && (
                            <Button variant="danger" className="w-full justify-center text-[14px]" onClick={() => setShowCloseConfirm(true)}>
                                إغلاق العطاء
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                <div className="flex flex-col gap-6">
                    <div className="rounded-[16px] border border-border bg-surface p-6 shadow-sm sm:p-7">
                        <h2 className="mb-4 font-display text-[18px] font-bold text-ink">تفاصيل العطاء</h2>
                        <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[#374151]">
                            {tender.description}
                        </div>

                        {tender.customFields && tender.customFields.length > 0 && (
                            <>
                                <hr className="my-6 border-0 border-t border-border" />
                                <h3 className="mb-4 font-display text-[15px] font-bold text-ink">متطلبات وشروط إضافية</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {tender.customFields.map((field, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 rounded-[12px] border border-border bg-paper/50 px-4 py-3.5 transition-all hover:border-border hover:bg-paper hover:shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] font-semibold text-text-secondary">{field.label}</span>
                                                {field.isPriority && (
                                                    <span className="rounded bg-registry-green/10 px-1.5 py-0.5 text-[10px] font-bold text-registry-green" title="حقل ذو أولوية للتقييم">
                                                        أولوية
                                                    </span>
                                                )}
                                            </div>
                                            <div className="break-words text-[13.5px] font-medium leading-[1.5] text-ink">{field.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {tender.officialBookUrl && (
                            <>
                                <hr className="my-6 border-0 border-t border-border" />
                                <h3 className="mb-4 font-display text-[15px] font-bold text-ink">الكتاب الرسمي</h3>
                                <a
                                    href={tender.officialBookUrl.startsWith('http') ? tender.officialBookUrl : `${API_ORIGIN}${tender.officialBookUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2.5 rounded-[12px] border border-border bg-[#FAFAFA] px-4 py-2.5 text-[14px] font-semibold text-registry-green transition-all hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green"
                                >
                                    <Icon name="document" className="h-5 w-5 shrink-0" />
                                    <bdi dir="ltr">{tender.officialBookName || 'عرض الكتاب الرسمي'}</bdi>
                                </a>
                            </>
                        )}
                    </div>

                    {!isCheckingMyProposal && renderSubmitPanel()}

                    {/* Proposals List (for owner and admin) */}
                    {(isOwner || isAdmin) && (
                        <div className="rounded-[16px] border border-border bg-surface p-6 shadow-sm sm:p-7 overflow-hidden">
                            <h2 className="mb-6 font-display text-[18px] font-bold text-ink">العروض المقدمة</h2>

                            {isProposalsLoading ? (
                                <div className="py-8"><Spinner label="جاري تحميل العروض..." /></div>
                            ) : proposalsError ? (
                                <ErrorState message={proposalsError} onRetry={fetchProposals} />
                            ) : proposals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-border bg-[#FAFAFA] p-10 text-center">
                                    <div className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-sm">
                                        <Icon name="document" className="h-6 w-6" />
                                    </div>
                                    <p className="text-[14px] font-semibold text-ink">لم يتم تقديم أي عروض على هذا العطاء بعد</p>
                                    <span className="mt-1 text-[12px] text-text-secondary">سيتم عرض العروض هنا فور استلامها</span>
                                </div>
                            ) : (
                                <ResponsiveTable
                                    headers={['الشركة المقدمة', 'السعر', 'تقييم الذكاء الاصطناعي', 'المستند', 'الحالة', 'الإجراءات']}
                                    rows={proposals.map(prop => ({
                                        id: prop._id,
                                        cells: [
                                            <div className="max-w-[200px]">
                                                <bdi className="font-bold text-ink">{prop.submittedBy.companyName}</bdi>
                                                {prop.aiExtractedData?.summary && (
                                                    <p className="mt-1 truncate text-xs text-text-secondary" title={prop.aiExtractedData.summary}>
                                                        {prop.aiExtractedData.summary}
                                                    </p>
                                                )}
                                            </div>,
                                            <div className="tabular-nums" dir="ltr">
                                                <div className="font-bold text-ink">{prop.finalPrice} ₪</div>
                                                {prop.aiExtractedData?.extractedPrice && prop.aiExtractedData.extractedPrice.toString() !== prop.finalPrice.toString() && (
                                                    <div className="text-xs text-text-secondary line-through mt-0.5" title="السعر المستخرج آلياً">
                                                        {prop.aiExtractedData.extractedPrice} ₪
                                                    </div>
                                                )}
                                            </div>,
                                            prop.aiExtractedData?.overallScore !== undefined
                                                ? <div className="min-w-[140px] flex flex-col items-start gap-2"><div className="inline-flex flex-col gap-0.5"><span className="rounded bg-registry-green/10 px-2 py-1 text-[13px] font-bold text-registry-green tabular-nums" dir="ltr">{Math.round(normalizePercent(prop.aiExtractedData.overallScore))}/100</span><span className="text-[11px] text-text-secondary text-center">توافق</span></div><button type="button" onClick={() => { setViewingAnalysisData(prop.aiExtractedData); setViewingAnalysisCompany(prop.submittedBy.companyName); }} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-registry-green hover:underline focus:outline-none"><Icon name="sparkle" className="h-3.5 w-3.5" /> عرض التفاصيل</button></div>
                                                : <span className="inline-block rounded bg-paper px-2 py-1 text-[11px] font-medium text-text-secondary border border-border">لم يتم التحليل</span>,
                                            <a
                                                href={prop.documentUrl.startsWith('http') ? prop.documentUrl : `${API_ORIGIN}${prop.documentUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-[#FAFAFA] px-3 py-1.5 text-[13px] font-semibold text-registry-green transition-colors hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green"
                                            >
                                                <Icon name="document" className="h-4 w-4" />
                                                المستند
                                            </a>,
                                            <StatusStamp status={prop.status} />,
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {isOwner && prop.status === 'accepted' && (
                                                        <Link to={`/proposals/${prop._id}/negotiation`}>
                                                            <button type="button" className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-[#D1D5DB] hover:bg-paper">فتح التفاوض</button>
                                                        </Link>
                                                    )}
                                                    {isOwner && prop.status === 'submitted' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-registry-green px-3 py-1.5 text-[12px] font-semibold text-surface shadow-sm transition-colors hover:bg-green-dark"
                                                                onClick={() => setDecisionConfirm({ id: prop._id, status: 'accepted', company: prop.submittedBy.companyName })}
                                                            >
                                                                قبول
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="inline-flex items-center justify-center rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1.5 text-[12px] font-semibold text-[#DC2626] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                                                                onClick={() => setDecisionConfirm({ id: prop._id, status: 'rejected', company: prop.submittedBy.companyName })}
                                                            >
                                                                رفض
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                {isOwner && (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-[#D1D5DB] hover:bg-paper disabled:pointer-events-none disabled:opacity-50"
                                                            onClick={() => handleAnalyzeExistingProposal(prop._id)}
                                                            disabled={analyzingProposalId === prop._id}
                                                        >
                                                            <Icon name="sparkle" className="h-3.5 w-3.5 text-registry-green" />
                                                            {analyzingProposalId === prop._id ? 'جاري التحليل...' : prop.aiExtractedData?.overallScore !== undefined ? 'إعادة التحليل' : 'تحليل AI'}
                                                        </button>
                                                        {proposalAnalysisErrors[prop._id] ? <span className="text-[11px] text-error" role="alert">{proposalAnalysisErrors[prop._id]}</span> : null}
                                                    </div>
                                                )}
                                            </div>
                                        ]
                                    }))}
                                    renderMobileCard={(row) => {
                                        const prop = proposals.find(p => p._id === row.id);
                                        return (
                                            <div key={row.id} className="flex flex-col gap-4 rounded-[12px] border border-border bg-surface p-4 shadow-sm">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <bdi className="block truncate text-[16px] font-bold text-ink">{prop.submittedBy.companyName}</bdi>
                                                        <div className="mt-1 text-[14px] font-bold text-ink tabular-nums" dir="ltr">{prop.finalPrice} ₪</div>
                                                        {prop.aiExtractedData?.extractedPrice && prop.aiExtractedData.extractedPrice.toString() !== prop.finalPrice.toString() && (
                                                            <div className="mt-0.5 text-[12px] text-text-secondary line-through" dir="ltr">{prop.aiExtractedData.extractedPrice} ₪</div>
                                                        )}
                                                    </div>
                                                    <StatusStamp status={prop.status} />
                                                </div>

                                                <div className="flex items-center justify-between border-t border-border pt-3">
                                                    {prop.aiExtractedData?.overallScore !== undefined
                                                        ? <div className="flex flex-col gap-2 items-start"><div className="inline-flex rounded bg-registry-green/10 px-2 py-1 text-[12px] font-bold text-registry-green"><span dir="ltr">{Math.round(normalizePercent(prop.aiExtractedData.overallScore))}/100</span> توافق</div><button type="button" onClick={() => { setViewingAnalysisData(prop.aiExtractedData); setViewingAnalysisCompany(prop.submittedBy.companyName); }} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-registry-green hover:underline focus:outline-none"><Icon name="sparkle" className="h-3.5 w-3.5" /> عرض التفاصيل</button></div>
                                                        : <span className="rounded bg-paper px-2 py-1 text-[11px] font-medium text-text-secondary border border-border">لم يتم التحليل</span>
                                                    }

                                                    <a
                                                        href={prop.documentUrl.startsWith('http') ? prop.documentUrl : `${API_ORIGIN}${prop.documentUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-[#FAFAFA] px-3 py-1.5 text-[12px] font-semibold text-registry-green transition-colors hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green"
                                                    >
                                                        <Icon name="document" className="h-3.5 w-3.5" />
                                                        المستند
                                                    </a>
                                                </div>

                                                {(isOwner && prop.status === 'submitted') && (
                                                    <div className="flex gap-2 border-t border-border pt-3">
                                                        <button
                                                            type="button"
                                                            className="inline-flex flex-1 items-center justify-center rounded-md border border-transparent bg-registry-green px-3 py-2 text-[13px] font-semibold text-surface shadow-sm transition-colors hover:bg-green-dark"
                                                            onClick={() => setDecisionConfirm({ id: prop._id, status: 'accepted', company: prop.submittedBy.companyName })}
                                                        >
                                                            قبول
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="inline-flex flex-1 items-center justify-center rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#DC2626] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                                                            onClick={() => setDecisionConfirm({ id: prop._id, status: 'rejected', company: prop.submittedBy.companyName })}
                                                        >
                                                            رفض
                                                        </button>
                                                    </div>
                                                )}
                                                {isOwner && prop.status === 'accepted' && (
                                                    <div className="border-t border-border pt-3">
                                                        <Link to={`/proposals/${prop._id}/negotiation`} className="flex">
                                                            <button type="button" className="inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-[#D1D5DB] hover:bg-paper">فتح التفاوض</button>
                                                        </Link>
                                                    </div>
                                                )}
                                                {isOwner && (
                                                    <div className="flex flex-col gap-1 border-t border-border pt-3">
                                                        <button
                                                            type="button"
                                                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-[#D1D5DB] hover:bg-paper disabled:pointer-events-none disabled:opacity-50"
                                                            onClick={() => handleAnalyzeExistingProposal(prop._id)}
                                                            disabled={analyzingProposalId === prop._id}
                                                        >
                                                            <Icon name="sparkle" className="h-4 w-4 text-registry-green" />
                                                            {analyzingProposalId === prop._id ? 'جاري التحليل...' : prop.aiExtractedData?.overallScore !== undefined ? 'إعادة التحليل' : 'تحليل AI'}
                                                        </button>
                                                        {proposalAnalysisErrors[prop._id] ? <p className="text-[11px] text-error text-center" role="alert">{proposalAnalysisErrors[prop._id]}</p> : null}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <div className="sticky top-[88px]">
                        <DataRail title="معلومات العطاء" items={railItems} />
                    </div>
                </div>
            </div>
        </div>

        <AnalysisDetailsModal
            isOpen={!!viewingAnalysisData}
            data={viewingAnalysisData}
            companyName={viewingAnalysisCompany}
            onClose={() => { setViewingAnalysisData(null); setViewingAnalysisCompany(""); }}
        />

        <ConfirmDialog
                isOpen={showCloseConfirm}
                title="إغلاق العطاء"
                message="هل أنت متأكد من إغلاق هذا العطاء؟ لن تتمكن من استقبال أي عروض جديدة، وهذا الإجراء لا يمكن التراجع عنه."
                confirmLabel={isClosing ? "جاري الإغلاق..." : "تأكيد الإغلاق"}
                onConfirm={handleClose}
                onCancel={() => !isClosing && setShowCloseConfirm(false)}
                isDestructive={true}
            />

            <ConfirmDialog
                isOpen={!!decisionConfirm}
                title={decisionConfirm?.status === 'accepted' ? "قبول العرض" : "رفض العرض"}
                message={`هل أنت متأكد من ${decisionConfirm?.status === 'accepted' ? 'قبول' : 'رفض'} عرض "${decisionConfirm?.company}"؟`}
                confirmLabel={decisionConfirm?.status === 'accepted' ? "تأكيد القبول" : "تأكيد الرفض"}
                onConfirm={handleProposalDecision}
                onCancel={() => setDecisionConfirm(null)}
                isDestructive={decisionConfirm?.status === 'rejected'}
            />
        </>
    );
}
