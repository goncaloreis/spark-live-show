import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  loading?: boolean;
}

export const StatsCard = ({ title, value, icon: Icon, trend, loading }: StatsCardProps) => {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] hover:border-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            ) : (
              <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {value}
              </h3>
            )}
            {trend && (
              <p className="text-xs text-secondary font-medium">{trend}</p>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3 ring-1 ring-primary/20">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </Card>
  );
};
