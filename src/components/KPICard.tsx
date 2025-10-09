import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
  };
  suffix?: string;
}

export const KPICard = ({ label, value, change, suffix }: KPICardProps) => {
  return (
    <div className="group relative py-5 px-3 -mx-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all duration-300 rounded-xl">
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-1 rounded-full bg-gradient-to-b from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
            {label}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-foreground tabular-nums tracking-tight">
                {value}
              </span>
              {suffix && (
                <span className="text-xs text-muted-foreground/60 font-medium">{suffix}</span>
              )}
            </div>
          </div>
          
          {change && change.direction !== 'neutral' && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-300 border ${
              change.direction === 'up' 
                ? 'bg-[hsl(142_76%_45%_/_0.15)] text-[hsl(142_76%_45%)] border-[hsl(142_76%_45%_/_0.3)] shadow-[0_0_12px_hsl(142_76%_45%_/_0.2)]' 
                : 'bg-[hsl(0_72%_55%_/_0.15)] text-[hsl(0_72%_55%)] border-[hsl(0_72%_55%_/_0.3)] shadow-[0_0_12px_hsl(0_72%_55%_/_0.2)]'
            }`}>
              {change.direction === 'up' ? (
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
              ) : (
                <ArrowDown className="w-3.5 h-3.5" strokeWidth={2.5} />
              )}
              <span className="text-xs font-bold tabular-nums">
                {change.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
