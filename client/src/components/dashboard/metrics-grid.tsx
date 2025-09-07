import { Eye, Network, Image, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Metrics {
  totalRequests: number;
  uniqueIPs: number;
  imagesServed: number;
  avgResponseTime: number;
  recentActivity: number;
}

interface MetricsGridProps {
  metrics?: Metrics;
  isLoading: boolean;
}

export default function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-6">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-10 w-16 mb-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-requests">
              {metrics?.totalRequests?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-green-500 font-medium">
            {metrics?.recentActivity ? `+${metrics.recentActivity}` : '+0'}
          </span>
          <span className="text-muted-foreground ml-1">from last hour</span>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Unique IPs</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-unique-ips">
              {metrics?.uniqueIPs?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Network className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-muted-foreground">Tracked addresses</span>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Images Served</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-images-served">
              {metrics?.imagesServed?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Image className="h-5 w-5 text-orange-500" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-muted-foreground">100% success rate</span>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-avg-response-time">
              {metrics?.avgResponseTime || 0}ms
            </p>
          </div>
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-green-500" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-green-500 font-medium">Optimal</span>
          <span className="text-muted-foreground ml-1">performance</span>
        </div>
      </div>
    </div>
  );
}