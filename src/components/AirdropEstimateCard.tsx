import { TrendingUp } from "lucide-react";

interface AirdropEstimateCardProps {
  values: {
    "150M": string;
    "200M": string;
    "250M": string;
  };
  spkPrice: number | null;
}

export const AirdropEstimateCard = ({ values, spkPrice }: AirdropEstimateCardProps) => {
  const hasData = values["150M"] !== "-";
  
  return (
    <div className="space-y-6">
      {hasData ? (
        <>
          {/* SPK Price Display */}
          {spkPrice && (
            <div className="flex items-center justify-center gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <TrendingUp className="w-4 h-4 text-primary/60" />
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span className="text-xs text-muted-foreground/60 font-medium">Live SPK Price:</span>
                <span className="text-sm font-bold text-primary">${spkPrice.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Three Scenarios */}
          <div className="grid grid-cols-1 gap-4">
            {/* 150M SPK */}
            <div className="group relative p-5 rounded-xl bg-card/40 border border-white/5 hover:border-white/10 hover:bg-card/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                    150M SPK Airdrop
                  </div>
                  <div className="text-2xl font-bold text-foreground/90 tabular-nums">
                    {values["150M"]}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-xs font-bold text-primary">Conservative</span>
                </div>
              </div>
            </div>

            {/* 200M SPK */}
            <div className="group relative p-5 rounded-xl bg-gradient-to-br from-primary/5 via-card/40 to-card/40 border border-primary/10 hover:border-primary/20 hover:from-primary/8 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                    200M SPK Airdrop
                  </div>
                  <div className="text-2xl font-bold text-gradient-static tabular-nums">
                    {values["200M"]}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/25">
                  <span className="text-xs font-bold text-primary">Moderate</span>
                </div>
              </div>
            </div>

            {/* 250M SPK */}
            <div className="group relative p-5 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 hover:border-primary/30 hover:from-primary/15 hover:via-secondary/15 hover:to-primary/15 transition-all duration-300 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer" />
              
              <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wider">
                    250M SPK Airdrop
                  </div>
                  <div className="text-2xl font-bold text-gradient-static tabular-nums">
                    {values["250M"]}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                  <span className="text-xs font-bold text-primary">Optimistic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground/40 font-medium">
              Estimates based on your current pool share × total airdrop × live SPK price
            </p>
          </div>
        </>
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
