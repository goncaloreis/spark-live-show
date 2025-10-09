import { Sparkles } from "lucide-react";

interface AirdropEstimateCardProps {
  label: string;
  lowValue: string;
  highValue: string;
}

export const AirdropEstimateCard = ({ label, lowValue, highValue }: AirdropEstimateCardProps) => {
  return (
    <div className="group relative py-5 px-3 -mx-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all duration-300 rounded-xl">
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer rounded-xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
            {label}
          </span>
        </div>
        
        {lowValue !== "-" && highValue !== "-" ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-4">
              {/* Low estimate */}
              <div className="flex-1">
                <div className="text-xs text-muted-foreground/60 font-medium mb-1.5">Conservative</div>
                <div className="text-base font-bold text-foreground/70 tabular-nums">
                  {lowValue}
                </div>
              </div>
              
              {/* Gradient separator */}
              <div className="flex-1 h-px bg-gradient-to-r from-primary/40 via-secondary/40 to-transparent" />
              
              {/* High estimate */}
              <div className="flex-1 text-right">
                <div className="text-xs text-muted-foreground/60 font-medium mb-1.5">Optimistic</div>
                <div className="text-xl font-bold text-gradient-static tabular-nums">
                  {highValue}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-1 w-1 rounded-full bg-primary/50" />
              <p className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider">
                @ $0.05 → $0.15 per SPK
              </p>
              <div className="h-1 w-1 rounded-full bg-secondary/50" />
            </div>
          </div>
        ) : (
          <div className="text-lg font-semibold text-muted-foreground/30">-</div>
        )}
      </div>
    </div>
  );
};
