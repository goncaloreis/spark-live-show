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

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-md" />
        <div className="relative bg-card/80 backdrop-blur-xl border border-primary/30 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[60px] sm:min-w-[80px]">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient tabular-nums">
            {formatNumber(value)}
          </span>
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-medium mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-700" />
        <div className="relative glass border border-primary/20 rounded-xl p-4 sm:p-6 backdrop-blur-3xl">
          <div className="text-center mb-4 sm:mb-5">
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
              Season 2 Ends In
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70">
              December 11, 2025 at 23:59:59
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <TimeUnit value={timeRemaining.days} label="Days" />
            <span className="text-2xl sm:text-3xl text-muted-foreground/30 font-bold pb-6">:</span>
            <TimeUnit value={timeRemaining.hours} label="Hours" />
            <span className="text-2xl sm:text-3xl text-muted-foreground/30 font-bold pb-6">:</span>
            <TimeUnit value={timeRemaining.minutes} label="Minutes" />
            <span className="text-2xl sm:text-3xl text-muted-foreground/30 font-bold pb-6">:</span>
            <TimeUnit value={timeRemaining.seconds} label="Seconds" />
          </div>
        </div>
      </div>
    </div>
  );
};
