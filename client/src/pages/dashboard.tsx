import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import MetricsGrid from "../components/dashboard/metrics-grid";
import LogTable from "../components/dashboard/log-table";
import { Download, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Metrics {
  totalRequests: number;
  uniqueIPs: number;
  imagesServed: number;
  avgResponseTime: number;
  recentActivity: number;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ['/api/metrics'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ip_logs.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "IP logs have been exported to CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground">Monitor IP logging activity and system status</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">System Active</span>
              </div>
              <Button 
                onClick={handleExportLogs}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-export-logs"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Metrics Grid */}
          <MetricsGrid metrics={metrics} isLoading={metricsLoading} />

          {/* Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                  <select className="bg-input border border-border rounded-md px-3 py-1 text-sm text-foreground">
                    <option>Last 24 hours</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-3 mx-auto" />
                    <p className="text-muted-foreground">Activity Chart</p>
                    <p className="text-sm text-muted-foreground">Real-time request monitoring</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Image Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Image</span>
                  <span className="text-sm font-medium text-foreground">decoy_pixel.gif</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">File Size</span>
                  <span className="text-sm font-medium text-foreground">43 B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium text-foreground">GIF</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-green-500">Active</span>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Preview</p>
                  <div className="w-full h-24 bg-muted/50 rounded-md flex items-center justify-center border border-border">
                    <span className="text-xs text-muted-foreground">1x1 Transparent Pixel</span>
                  </div>
                </div>
                
                <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  Change Image
                </Button>
              </div>
            </div>
          </div>

          {/* Log Table */}
          <LogTable />
        </div>
      </main>
    </div>
  );
}
