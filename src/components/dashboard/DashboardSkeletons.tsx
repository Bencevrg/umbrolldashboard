import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const StatsGridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <Card>
    <CardContent className="pt-6">
      <Skeleton className="h-[250px] w-full" />
    </CardContent>
  </Card>
);

export const TableSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export const EmptyState = ({ message, children }: { message: string; children?: React.ReactNode }) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-16">
      <h3 className="text-lg font-semibold text-foreground mb-2">Nincsenek adatok</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">{message}</p>
      {children}
    </CardContent>
  </Card>
);
