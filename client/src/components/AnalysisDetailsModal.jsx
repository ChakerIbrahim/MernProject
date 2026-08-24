import PropTypes from 'prop-types';
import { useEffect } from 'react';
import Icon from './Icon';

function normalizePercent(value) {
    const score = Number(value || 0);
    return score > 0 && score <= 1 ? score * 100 : score;
}

export default function AnalysisDetailsModal({ isOpen, data, onClose, companyName }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !data) return null;

    const overallScore = Math.round(normalizePercent(data.overallScore));
    const confidenceScore = Math.round(normalizePercent(data.confidenceScore));
    const assessments = Array.isArray(data.priorityAssessment) ? data.priorityAssessment : [];
    const strengths = Array.isArray(data.strengths) ? data.strengths : [];
    const gaps = Array.isArray(data.gaps) ? data.gaps : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="relative flex w-full max-w-3xl max-h-[90vh] flex-col rounded-2xl bg-surface shadow-2xl motion-rise-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="analysis-dialog-title"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-registry-green/10 text-registry-green">
                            <Icon name="sparkle" className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="analysis-dialog-title" className="font-display text-lg font-bold text-ink">
                                تقييم الذكاء الاصطناعي
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5">
                                عرض مقدم من: <span className="font-semibold text-ink">{companyName || 'الشركة'}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-paper hover:text-ink focus:outline-none focus:ring-1 focus:ring-registry-green"
                        aria-label="إغلاق"
                    >
                        <Icon name="close" className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">

                        {/* Score Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
                                <span className="block text-xs font-semibold text-text-secondary">درجة التوافق</span>
                                <strong className="mt-1 block text-3xl font-bold text-registry-green tabular-nums" dir="ltr">{overallScore}/100</strong>
                            </div>
                            <div className="rounded-xl border border-border bg-paper p-4 text-center">
                                <span className="block text-xs font-semibold text-text-secondary">ثقة التحليل</span>
                                <strong className="mt-1 block text-3xl font-bold text-ink tabular-nums" dir="ltr">{confidenceScore}%</strong>
                            </div>
                        </div>

                        {/* Summary */}
                        {data.summary && (
                            <div className="rounded-xl border border-border bg-paper p-5">
                                <h3 className="mb-2 text-sm font-bold text-ink">الملخص</h3>
                                <p className="text-sm leading-relaxed text-text-secondary">{data.summary}</p>
                            </div>
                        )}

                        {/* Strengths & Gaps */}
                        {(strengths.length > 0 || gaps.length > 0) && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {strengths.length > 0 && (
                                    <div className="rounded-xl border border-success/20 bg-success/5 p-5">
                                        <h3 className="mb-3 text-sm font-bold text-success flex items-center gap-2">
                                            <Icon name="check" className="h-4 w-4" /> نقاط القوة
                                        </h3>
                                        <ul className="space-y-2.5 text-xs leading-relaxed text-ink">
                                            {strengths.map((item, index) => (
                                                <li key={`strength-${index}`} className="flex gap-2.5">
                                                    <span className="text-success shrink-0 mt-0.5">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {gaps.length > 0 && (
                                    <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
                                        <h3 className="mb-3 text-sm font-bold text-ink flex items-center gap-2">
                                            <Icon name="bell" className="h-4 w-4 text-warning" /> الفجوات والملاحظات
                                        </h3>
                                        <ul className="space-y-2.5 text-xs leading-relaxed text-ink">
                                            {gaps.map((item, index) => (
                                                <li key={`gap-${index}`} className="flex gap-2.5">
                                                    <span className="text-warning shrink-0 mt-0.5">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Detailed Assessments */}
                        {assessments.length > 0 && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold text-ink">تقييم الحقول والمتطلبات بالتفصيل</h3>
                                <div className="grid gap-3">
                                    {assessments.map((item, index) => {
                                        const score = Math.round(normalizePercent(item.score));
                                        const isMissing = score === 0;
                                        return (
                                            <div key={`${item.key || item.label || 'field'}-${index}`} className="rounded-xl border border-border bg-paper p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <span className="text-sm font-bold text-ink">{item.label || item.key}</span>
                                                        {item.status && (
                                                            <span className="mt-1 block text-xs font-semibold text-text-secondary">{item.status}</span>
                                                        )}
                                                    </div>
                                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${isMissing ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`} dir="ltr">
                                                        {score}/100
                                                    </span>
                                                </div>
                                                {item.evidence && (
                                                    <div className="mt-3 rounded-lg bg-surface p-3">
                                                        <span className="mb-1 block text-[10px] font-bold text-text-secondary">الدليل من العرض:</span>
                                                        <p className="text-xs leading-relaxed text-ink">{item.evidence}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-border bg-paper px-6 py-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto rounded-xl bg-surface border border-border px-6 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-paper focus:outline-none focus:ring-1 focus:ring-registry-green"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}

AnalysisDetailsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    data: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    companyName: PropTypes.string
};
