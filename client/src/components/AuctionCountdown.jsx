import { useEffect, useState } from 'react';

/**
 * @param {{ endsAt: string|Date }} props
 */
export default function AuctionCountdown({ endsAt, variant = 'dark' }) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const update = () => setRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    update();
    const timerId = window.setInterval(update, 1000);
    return () => window.clearInterval(timerId);
  }, [endsAt]);

  if (remainingMs <= 0) {
    return <span className="text-xl" aria-live="polite">انتهى الوقت</span>;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isLight = variant === 'light';

  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto" dir="ltr" aria-live="polite">
      <div className="text-center">
        <div className={`relative overflow-hidden rounded-xl border px-1.5 sm:px-2 py-2 sm:py-3.5 ${isLight ? 'bg-registry-green/5 border-registry-green/10' : 'bg-white/10 border-white/10'}`}>
          <div className={`text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums ${isLight ? 'text-registry-green' : 'text-white'}`}>{String(days).padStart(2, '0')}</div>
        </div>
        <div className={`mt-1 sm:mt-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.13em] ${isLight ? 'text-text-secondary' : 'text-white/60'}`}>أيام</div>
      </div>
      <div className="text-center">
        <div className={`relative overflow-hidden rounded-xl border px-1.5 sm:px-2 py-2 sm:py-3.5 ${isLight ? 'bg-registry-green/5 border-registry-green/10' : 'bg-white/10 border-white/10'}`}>
          <div className={`text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums ${isLight ? 'text-registry-green' : 'text-white'}`}>{String(hours).padStart(2, '0')}</div>
        </div>
        <div className={`mt-1 sm:mt-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.13em] ${isLight ? 'text-text-secondary' : 'text-white/60'}`}>ساعات</div>
      </div>
      <div className="text-center">
        <div className={`relative overflow-hidden rounded-xl border px-1.5 sm:px-2 py-2 sm:py-3.5 ${isLight ? 'bg-registry-green/5 border-registry-green/10' : 'bg-white/10 border-white/10'}`}>
          <div className={`text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums ${isLight ? 'text-registry-green' : 'text-white'}`}>{String(minutes).padStart(2, '0')}</div>
        </div>
        <div className={`mt-1 sm:mt-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.13em] ${isLight ? 'text-text-secondary' : 'text-white/60'}`}>دقائق</div>
      </div>
      <div className="text-center">
        <div className={`relative overflow-hidden rounded-xl border px-1.5 sm:px-2 py-2 sm:py-3.5 ${isLight ? 'bg-error/5 border-error/10' : 'bg-white/10 border-white/10'}`}>
          <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-error tabular-nums">{String(seconds).padStart(2, '0')}</div>
        </div>
        <div className={`mt-1 sm:mt-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.13em] ${isLight ? 'text-text-secondary' : 'text-white/60'}`}>ثواني</div>
      </div>
    </div>
  );
}
