/**
 * Loading skeleton components for better UX during data fetching
 */

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const MetricRowSkeleton = () => (
  <Card className="card-premium border-white/5 p-3">
    <div className="flex items-center gap-6">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  </Card>
);

export const ChartSkeleton = () => (
  <Card className="glass p-6 border-border/50">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  </Card>
);

export const ProjectionSkeleton = () => (
  <Card className="card-premium border-white/5 p-4">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  </Card>
);
