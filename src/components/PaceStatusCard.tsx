import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChangeIndicator } from "@/types/wallet";

interface PaceStatusCardProps {
  shareChangeDirection: ChangeIndicator['direction'];
}

export const PaceStatusCard = memo(({ shareChangeDirection }: PaceStatusCardProps) => {
  let message: string;
  let icon: React.ReactNode;
  let colorClass: string;
  let showPulse = false;
  
  if (shareChangeDirection === 'up') {
    message = 'OUTPACING the pool';
    icon = <TrendingUp className="w-4 h-4" />;
    colorClass = 'text-green-500';
    showPulse = true;
  } else if (shareChangeDirection === 'down') {
    message = 'TRAILING the pool';
    icon = <TrendingDown className="w-4 h-4" />;
    colorClass = 'text-red-500';
  } else {
    message = 'KEEPING PACE with the pool';
    icon = <Minus className="w-4 h-4" />;
    colorClass = 'text-muted-foreground';
  }
  
  return (
    <Card className="card-premium border-white/5 hover:border-primary/20 transition-all duration-300 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`relative ${colorClass}`}>
            {icon}
            {showPulse && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Pace Status
          </span>
        </div>
        
        <span className={`text-sm font-bold ${colorClass}`}>
          {message}
        </span>
      </div>
    </Card>
  );
});
