interface AirdropEstimateCardProps {
  values: {
    "150M": string;
    "200M": string;
    "250M": string;
  };
}

export const AirdropEstimateCard = ({ values }: { values: AirdropEstimateCardProps['values'] }) => {
  const hasData = values["150M"] !== "-";
  
  return (
    <div className="flex flex-col h-full">
      {hasData ? (
        <>
          {/* Three Scenarios */}
          <div className="grid grid-cols-1 gap-2.5 flex-1">
            {/* 150M SPK */}
            <div className="group relative p-3 rounded-lg bg-card/40 border border-white/5 hover:border-white/10 hover:bg-card/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    150M SPK Airdrop
                  </div>
                  <div className="text-lg font-bold text-foreground/90 tabular-nums">
                    {values["150M"]}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Conservative</span>
                </div>
              </div>
            </div>

            {/* 200M SPK */}
            <div className="group relative p-3 rounded-lg bg-gradient-to-br from-primary/5 via-card/40 to-card/40 border border-primary/10 hover:border-primary/20 hover:from-primary/8 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    200M SPK Airdrop
                  </div>
                  <div className="text-lg font-bold text-gradient-static tabular-nums">
                    {values["200M"]}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-primary/15 border border-primary/25">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Moderate</span>
                </div>
              </div>
            </div>

            {/* 250M SPK */}
            <div className="group relative p-3 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 hover:border-primary/30 hover:from-primary/15 hover:via-secondary/15 hover:to-primary/15 transition-all duration-300 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer" />
              
              <div className="relative flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">
                    250M SPK Airdrop
                  </div>
                  <div className="text-lg font-bold text-gradient-static tabular-nums">
                    {values["250M"]}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)]">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Optimistic</span>
                </div>
              </div>
            </div>
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
