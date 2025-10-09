interface AirdropEstimateCardProps {
  label: string;
  lowValue: string;
  highValue: string;
}

export const AirdropEstimateCard = ({ label, lowValue, highValue }: AirdropEstimateCardProps) => {
  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {lowValue !== "-" && highValue !== "-" ? (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">{lowValue}</span>
          <span className="text-sm text-muted-foreground">→</span>
          <span className="text-lg font-semibold text-primary">{highValue}</span>
        </div>
      ) : (
        <span className="text-lg font-semibold text-muted-foreground">-</span>
      )}
      <p className="text-xs text-muted-foreground/70 mt-1">
        @ $0.05 → $0.15 per SPK
      </p>
    </div>
  );
};
