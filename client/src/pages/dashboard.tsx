import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import MetricsGrid from "../components/dashboard/metrics-grid";
import LogTable from "../components/dashboard/log-table";
import IPChecker from "../components/dashboard/ip-checker";
import SnowEffect from "@/components/ui/snow-effect";
import { Download, Activity, Globe, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Metrics {
  totalRequests: number;
  uniqueIPs: number;
  imagesServed: number;
  avgResponseTime: number;
  recentActivity: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
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
    <div className="flex h-screen bg-background relative overflow-hidden">
      <SnowEffect color="#ffffff" glow={true} density={60} speed={1.2} />
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="animate-slide-in-up">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground drop-shadow-lg">Dashboard</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Monitor IP logging activity and system status</p>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-4 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-muted-foreground">System Active</span>
                </div>
              </div>
              <Button 
                onClick={handleExportLogs}
                className="bg-primary hover:bg-primary/90 text-primary-foreground backdrop-blur-sm self-start sm:self-auto min-h-[44px] animate-slide-in-up shadow-lg"
                style={{ animationDelay: '150ms' }}
                data-testid="button-export-logs"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-md border-border animate-slide-in-up" style={{ animationDelay: '200ms' }}>
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-overview"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="ip-checker" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-ip-checker"
              >
                <Globe className="w-4 h-4 mr-2" />
                IP Checker
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-logs"
              >
                <FileText className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Metrics Grid */}
              <div className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                <MetricsGrid metrics={metrics} isLoading={metricsLoading} />
              </div>

              {/* Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 bg-card/80 backdrop-blur-md rounded-lg border border-border shadow-2xl animate-slide-in-up" style={{ animationDelay: '400ms' }}>
                  <div className="p-4 sm:p-6 border-b border-border">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                      <select className="bg-background border border-border rounded-md px-3 py-1 text-sm text-foreground w-full sm:w-auto min-h-[40px]">
                        <option>Last 24 hours</option>
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="h-48 sm:h-64 bg-muted/20 rounded-lg flex items-center justify-center border border-border">
                      <div className="text-center">
                        <Activity className="h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground mb-3 mx-auto animate-pulse" />
                        <p className="text-sm sm:text-base text-foreground">Activity Chart</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Real-time request monitoring</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border shadow-2xl animate-slide-in-up" style={{ animationDelay: '500ms' }}>
                  <div className="p-4 sm:p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Image Status</h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4">
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
                      <span className="text-sm font-medium text-green-500 drop-shadow-lg">Active</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Preview</p>
                      <div className="w-full h-24 bg-muted/20 rounded-md flex items-center justify-center border border-border">
                        <span className="text-xs text-muted-foreground">1x1 Transparent Pixel</span>
                      </div>
                    </div>

                    <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground backdrop-blur-sm min-h-[44px] animate-slide-in-up shadow-lg" style={{ animationDelay: '600ms' }}>
                      Change Image
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ip-checker" className="mt-6">
              <IPChecker />
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <LogTable />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}