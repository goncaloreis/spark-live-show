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
    <Card className="group relative overflow-hidden glass glass-hover shadow-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
      
      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-10 w-32 animate-pulse rounded-lg bg-muted/30" />
          ) : (
            <h3 className="text-4xl font-bold text-gradient leading-none">
              {value}
            </h3>
          )}
          {trend && (
            <p className="text-sm text-secondary/90 font-medium flex items-center gap-1">
              {trend}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
