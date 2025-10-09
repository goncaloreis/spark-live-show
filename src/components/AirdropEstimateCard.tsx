import { TrendingUp, Sparkles } from "lucide-react";

interface AirdropEstimateCardProps {
  conservativeValue: string;
  optimisticValue: string;
}

export const AirdropEstimateCard = ({ conservativeValue, optimisticValue }: AirdropEstimateCardProps) => {
  return (
    <div className="group relative py-6 px-4 hover:bg-white/[0.02] transition-all duration-300 rounded-xl">
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer rounded-xl" />
      
      <div className="relative space-y-6">
        {/* Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Estimated Airdrop Value Range
          </span>
        </div>

        {conservativeValue !== "-" && optimisticValue !== "-" ? (
          <>
            {/* Range Display */}
            <div className="flex items-center gap-3">
              {/* Conservative */}
              <div className="flex-1 p-4 rounded-xl bg-muted/30 border border-white/5 hover:border-white/10 transition-all duration-300">
                <div className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mb-2">
                  Conservative
                </div>
                <div className="text-2xl font-bold text-foreground/80 tabular-nums">
                  {conservativeValue}
                </div>
                <div className="text-[10px] text-muted-foreground/50 font-medium mt-2">
                  150M SPK @ $0.05
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1 px-2">
                <TrendingUp className="w-5 h-5 text-primary/40" />
                <div className="h-px w-8 bg-gradient-to-r from-muted via-primary/30 to-muted" />
              </div>

              {/* Optimistic */}
              <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider mb-2">
                    Optimistic
                  </div>
                  <div className="text-2xl font-bold text-gradient-static tabular-nums">
                    {optimisticValue}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 font-medium mt-2">
                    250M SPK @ $0.15
                  </div>
                </div>
              </div>
            </div>

            {/* Info Bar */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
              <div className="h-1 w-1 rounded-full bg-primary/50" />
              <p className="text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wider">
                Based on your current pool share
              </p>
              <div className="h-1 w-1 rounded-full bg-secondary/50" />
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-lg font-semibold text-muted-foreground/30">No data available</div>
            <p className="text-xs text-muted-foreground/50 mt-2">Track a wallet to see projections</p>
          </div>
        )}
      </div>
    </div>
  );
};
