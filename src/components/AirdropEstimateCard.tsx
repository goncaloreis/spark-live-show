import { ArrowRight } from "lucide-react";

interface AirdropEstimateCardProps {
  conservativeValue: string;
  optimisticValue: string;
}

export const AirdropEstimateCard = ({ conservativeValue, optimisticValue }: AirdropEstimateCardProps) => {
  return (
    <div className="group relative">
      {conservativeValue !== "-" && optimisticValue !== "-" ? (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
              Estimated Airdrop Value
            </p>
          </div>

          {/* Main Range Display */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-muted via-primary/20 to-muted -translate-y-1/2 z-0" />
            
            <div className="relative z-10 flex items-center justify-between gap-4">
              {/* Conservative Side */}
              <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                      Conservative
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-foreground/90 tabular-nums">
                    {conservativeValue}
                  </div>
                  <div className="text-xs text-muted-foreground/50 font-medium">
                    150M SPK @ $0.05
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>

              {/* Optimistic Side */}
              <div className="flex-1 bg-gradient-to-br from-primary/10 via-card/50 to-secondary/10 backdrop-blur-sm rounded-2xl border border-primary/20 p-6 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                      Optimistic
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gradient-static tabular-nums">
                    {optimisticValue}
                  </div>
                  <div className="text-xs text-muted-foreground/50 font-medium">
                    250M SPK @ $0.15
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground/40 font-medium">
              Based on your current pool share percentage
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <div className="text-2xl font-bold text-muted-foreground/20">—</div>
          <p className="text-sm text-muted-foreground/50">No projection data available</p>
          <p className="text-xs text-muted-foreground/40">Track a wallet to see estimates</p>
        </div>
      )}
    </div>
  );
};
