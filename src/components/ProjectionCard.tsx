import { Card } from "@/components/ui/card";

interface ProjectionCardProps {
  label: string;
  value: string;
  badge: string;
  variant: 'conservative' | 'moderate' | 'optimistic';
}

export const ProjectionCard = ({ label, value, badge, variant }: ProjectionCardProps) => {
  const hasData = value !== "-";
  
  const variantStyles = {
    conservative: "bg-card/40 border-white/5 hover:bg-card/60",
    moderate: "bg-gradient-to-br from-primary/5 via-card/40 to-card/40 border-primary/10 hover:border-primary/20 hover:from-primary/8",
    optimistic: "bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border-primary/20 hover:border-primary/30 hover:from-primary/15 hover:via-secondary/15 hover:to-primary/15"
  };
  
  const badgeStyles = {
    conservative: "bg-primary/10 border-primary/20",
    moderate: "bg-primary/15 border-primary/25",
    optimistic: "bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30 shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)]"
  };
  
  return (
    <Card className={`card-premium group transition-all duration-500 p-3 ${variantStyles[variant]}`}>
      {variant === 'optimistic' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer rounded-lg" />
      )}
      
      <div className="relative flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
            {label}
          </div>
          <div className="text-lg font-bold text-foreground/90 tabular-nums">
            {hasData ? value : "-"}
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-md ${badgeStyles[variant]}`}>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{badge}</span>
        </div>
      </div>
    </Card>
  );
};
