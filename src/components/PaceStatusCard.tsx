import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChangeIndicator } from "@/types/wallet";

interface PaceStatusCardProps {
  shareChangeDirection: ChangeIndicator['direction'];
}

export const PaceStatusCard = ({ shareChangeDirection }: PaceStatusCardProps) => {
  let status: 'outpacing' | 'trailing' | 'keeping-pace';
  let message: string;
  let icon: React.ReactNode;
  let colorClass: string;
  
  if (shareChangeDirection === 'up') {
    status = 'outpacing';
    message = 'Wallet Share is OUTPACING the Total Points Pool';
    icon = <TrendingUp className="w-5 h-5" />;
    colorClass = 'text-green-500';
  } else if (shareChangeDirection === 'down') {
    status = 'trailing';
    message = 'Wallet Share is TRAILING the Total Points Pool';
    icon = <TrendingDown className="w-5 h-5" />;
    colorClass = 'text-red-500';
  } else {
    status = 'keeping-pace';
    message = 'Wallet Share is KEEPING PACE with the Total Points Pool';
    icon = <Minus className="w-5 h-5" />;
    colorClass = 'text-muted-foreground';
  }
  
  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 hover:shadow-lg transition-all duration-300 p-4 h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-lg" />
      
      <div className="relative flex items-center justify-between gap-4 h-full">
        <div className="flex items-center gap-2">
          <div className={`relative transition-transform duration-200 group-hover:scale-110 ${colorClass}`}>
            {icon}
            {status === 'outpacing' && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
            )}
          </div>
          <span className="metric-label text-[10px] whitespace-nowrap">
            Pace Status
          </span>
        </div>
        
        <div className={`flex items-center gap-1.5 transition-all duration-200 group-hover:scale-105`}>
          <span className="text-base font-bold">
            {message.split(' ').map((word, idx) => {
              if (word === 'OUTPACING' || word === 'TRAILING' || word === 'KEEPING') {
                return <span key={idx} className={colorClass}>{word} </span>;
              }
              return <span key={idx} className="text-foreground/80">{word} </span>;
            })}
          </span>
        </div>
      </div>
    </Card>
  );
};
