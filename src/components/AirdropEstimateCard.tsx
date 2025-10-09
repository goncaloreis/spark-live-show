interface AirdropEstimateCardProps {
  label: string;
  lowValue: string;
  highValue: string;
}

export const AirdropEstimateCard = ({ label, lowValue, highValue }: AirdropEstimateCardProps) => {
  return (
    <div className="group py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-200 rounded-lg px-2 -mx-2">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">{label}</span>
      </div>
      {lowValue !== "-" && highValue !== "-" ? (
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-base font-semibold text-foreground/70 tabular-nums">{lowValue}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/20 to-transparent" />
            <span className="text-lg font-bold text-gradient tabular-nums">{highValue}</span>
          </div>
          <p className="text-xs text-muted-foreground/50 font-medium">
            @ $0.05 → $0.15 per SPK
          </p>
        </div>
      ) : (
        <span className="text-lg font-semibold text-muted-foreground/40">-</span>
      )}
    </div>
  );
};
