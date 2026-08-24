import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

export default function Countdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        return 'انتهى الوقت';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) return `${days} يوم و ${hours} ساعة`;
      if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
      return `${minutes} دقيقة و ${seconds} ثانية`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  if (timeLeft === 'انتهى الوقت') {
    return <span className="text-text-secondary">{timeLeft}</span>;
  }

  return <bdi className="tabular-nums font-medium" dir="ltr">{timeLeft}</bdi>;
}

Countdown.propTypes = {
  endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
};
