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
    <Card className={`card-premium group transition-all duration-300 p-4 h-full hover:shadow-lg ${variantStyles[variant]}`}>
      {variant === 'optimistic' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer rounded-lg" />
      )}
      
      <div className="relative flex flex-col justify-between h-full gap-3">
        <div className="flex items-start justify-between">
          <div className="metric-label text-[9px] leading-tight max-w-[70%]">
            {label}
          </div>
          <div className={`px-2 py-0.5 rounded-md transition-all duration-200 ${badgeStyles[variant]}`}>
            <span className="text-[9px] font-bold text-primary uppercase tracking-wide">{badge}</span>
          </div>
        </div>
        <div className="metric-value text-2xl text-foreground transition-all duration-200 group-hover:scale-105 group-hover:text-primary">
          {hasData ? value : "-"}
        </div>
      </div>
    </Card>
  );
};
