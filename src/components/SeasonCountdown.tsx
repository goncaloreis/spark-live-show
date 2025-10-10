/**
 * Season 2 Countdown Component
 * Displays countdown to Season 2 end date (December 11, 2025 23:59:59)
 */

import { useEffect, useState } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculates time remaining until the target date
 */
const calculateTimeRemaining = (): TimeRemaining => {
  // Season 2 ends on December 11, 2025 at 23:59:59
  const targetDate = new Date('2025-12-11T23:59:59');
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000)
  };
};

/**
 * Season countdown component with real-time updates
 */
export const SeasonCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground/70 font-medium">
      <span className="hidden sm:inline">Season 2 Countdown:</span>
      <span className="sm:hidden">S2 Ends:</span>
      <span className="font-mono font-bold text-foreground tabular-nums tracking-wider">
        {formatNumber(timeRemaining.days)}-{formatNumber(timeRemaining.hours)}:{formatNumber(timeRemaining.minutes)}:{formatNumber(timeRemaining.seconds)}
      </span>
    </div>
  );
};
