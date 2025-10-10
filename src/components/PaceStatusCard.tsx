import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PaceStatusCardProps {
  poolShareChange: number;
}

export const PaceStatusCard = ({ poolShareChange }: PaceStatusCardProps) => {
  const threshold = 0.0001; // Consider changes smaller than this as "keeping pace"
  
  let status: 'outpacing' | 'trailing' | 'keeping-pace';
  let message: string;
  let icon: React.ReactNode;
  let colorClass: string;
  
  if (poolShareChange > threshold) {
    status = 'outpacing';
    message = 'Wallet Share is OUTPACING the Total Points Pool';
    icon = <TrendingUp className="w-5 h-5" />;
    colorClass = 'text-green-500';
  } else if (poolShareChange < -threshold) {
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
    <Card className="group relative overflow-hidden glass glass-hover shadow-card p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="relative flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
          Pace Status
        </span>
        
        <div className={`flex items-center gap-3 ${colorClass}`}>
          {icon}
          <span className="text-lg font-bold uppercase tracking-wide">
            {message.split(' ').map((word, idx) => {
              if (word === 'OUTPACING' || word === 'TRAILING' || word === 'KEEPING') {
                return <span key={idx} className={colorClass}>{word} </span>;
              }
              return <span key={idx} className="text-foreground">{word} </span>;
            })}
          </span>
        </div>
      </div>
    </Card>
  );
};
