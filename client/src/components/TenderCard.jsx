import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function TenderCard({ tender }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, isExpired: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const diff = new Date(tender.deadline).getTime() - Date.now();
            if (diff <= 0) {
                return { days: 0, hours: 0, isExpired: true };
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            return { days, hours, isExpired: false };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000 * 60); // Update every minute is enough for this view

        return () => clearInterval(timer);
    }, [tender.deadline]);

    // Calculate circular progress (assume 30 days is 100% for visual scale)
    const maxDays = 30;
    const boundedDays = Math.min(Math.max(timeLeft.days, 0), maxDays);
    const circleCircumference = 326.73; // 2 * pi * 52
    const progressOffset = timeLeft.isExpired ? circleCircumference : circleCircumference - (boundedDays / maxDays) * circleCircumference;

    // Determine urgency color
    let urgencyClass = "stroke-registry-green"; // Safe/High days
    if (timeLeft.isExpired) urgencyClass = "stroke-error";
    else if (timeLeft.days <= 3) urgencyClass = "stroke-error"; // Low days
    else if (timeLeft.days <= 7) urgencyClass = "stroke-warning"; // Medium days

    const pubDate = new Date(tender.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const deadlineDate = new Date(tender.deadline).toLocaleDateString('en-CA');
    const deadlineTime = new Date(tender.deadline).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    return (
        <article className="group flex flex-col rounded-[20px] border border-ink/5 bg-surface shadow-sm transition-all duration-250 hover:-translate-y-0.5 hover:border-registry-green/25 hover:shadow-md md:flex-row md:border-s-[3px] md:border-s-registry-green">
            <div className="flex flex-1 flex-col border-b border-[#F1F2F4] p-5 md:border-b-0 md:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[13px] tabular-nums text-text-secondary before:block before:h-1.5 before:w-1.5 before:rounded-full before:bg-registry-green before:opacity-50">
                        تاريخ النشر: <span dir="ltr">{pubDate}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-registry-green/20 bg-registry-green/10 px-3.5 py-1 text-[12px] font-semibold tracking-wide text-registry-green">
                        <span className="block h-1.5 w-1.5 rounded-full bg-registry-green"></span>
                        {tender.category || 'عام'}
                    </span>
                </div>

                <h3 className="mb-3 font-display text-[17px] font-bold leading-relaxed text-ink">
                    <Link to={`/tenders/${tender._id}`} className="transition-colors hover:text-registry-green">
                        {tender.title}
                    </Link>
                </h3>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-[14px] text-text-secondary">
                    <span className="font-medium text-ink">{tender.createdBy?.companyName || 'جهة غير معروفة'}</span>
                    <span className="text-[#D1D5DB]">-</span>
                    <span className="font-medium text-ink">إدارة المشتريات</span>
                    <Link to={`/tenders/${tender._id}`} className="ms-auto inline-flex items-center gap-1 text-[13px] font-semibold text-registry-green transition-all hover:gap-2 hover:text-green-dark">
                        التفاصيل
                        <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
                    </Link>
                </div>

                <div className="mt-auto flex items-center gap-1.5 border-t border-[#F1F2F4] pt-3 text-[14px]">
                    <span className="font-medium text-text-secondary">النشاط الأساسي:</span>
                    <span className="font-medium text-ink">{tender.category || 'عام'}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-5 rounded-xl bg-paper/60 p-4 border-t border-[#F1F2F4] sm:grid-cols-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">الرقم المرجعي</span>
                        <span className="text-[14px] font-medium text-ink">{tender._id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">آخر موعد للعروض</span>
                        <span className="flex items-center gap-1.5 text-[14px] font-medium text-ink">
                            <Icon name="calendar" className="h-4 w-4 text-[#9CA3AF]" />
                            {deadlineDate}
                            <span className="text-[13px] font-normal text-text-secondary">{deadlineTime}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center gap-4 border-t border-[#F1F2F4] bg-paper/40 p-5 md:w-[260px] md:border-t-0 md:border-s md:p-6">
                <div className="flex flex-col items-center gap-2.5">
                    <div className="relative h-[110px] w-[110px]">
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="7" strokeLinecap="round" />
                            <circle
                                cx="60" cy="60" r="52"
                                fill="none"
                                className={`transition-all duration-1000 ease-out ${urgencyClass}`}
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={circleCircumference}
                                strokeDashoffset={progressOffset}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="font-display text-[26px] font-extrabold leading-none tracking-tight text-ink">
                                {timeLeft.isExpired ? '0' : timeLeft.days}
                            </span>
                            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">يوم</span>
                        </div>
                    </div>
                    <div className="text-center text-[13px] font-medium leading-relaxed text-text-secondary">
                        {timeLeft.isExpired ? (
                            <span className="text-error font-bold">انتهى الوقت</span>
                        ) : (
                            <>
                                <strong className="font-bold text-ink">{timeLeft.hours}</strong> ساعة متبقية
                            </>
                        )}
                    </div>
                </div>

                <div className="w-full border-t border-dashed border-ink/10 pt-3 text-center">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-secondary">الميزانية التقديرية</span>
                    <div className="mt-1 flex items-baseline justify-center gap-1">
                        {tender.budgetEstimate ? (
                            <>
                                <span className="font-display text-[20px] font-extrabold tracking-tight text-ink">{tender.budgetEstimate}</span>
                                <span className="text-[13px] font-medium text-text-secondary">₪</span>
                            </>
                        ) : (
                            <span className="font-display text-[16px] font-bold text-registry-green">غير محدد</span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

TenderCard.propTypes = {
    tender: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        status: PropTypes.string,
        category: PropTypes.string,
        budgetEstimate: PropTypes.number,
        deadline: PropTypes.string
    }).isRequired,
    isFeatured: PropTypes.bool
};
