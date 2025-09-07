import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Download, List, Eye, ArrowLeft } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface IpLog {
  id: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  timestamp: string;
  location: string;
  status: string;
}

interface LogsResponse {
  logs: IpLog[];
  total: number;
}

export default function LogEntries() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const logsPerPage = 25;
  const [location, setLocation] = useLocation();

  const { data, isLoading } = useQuery<LogsResponse>({
    queryKey: ['/api/logs', { limit: logsPerPage, offset: (currentPage - 1) * logsPerPage }],
    refetchInterval: 2000, // Refetch every 2 seconds for near real-time updates
  });

  const filteredLogs = data?.logs.filter(log => 
    log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
    log.userAgent.toLowerCase().includes(search.toLowerCase()) ||
    log.location.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((data?.total || 0) / logsPerPage);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const truncateUserAgent = (userAgent: string, maxLength: number = 80) => {
    return userAgent.length > maxLength ? userAgent.substring(0, maxLength) + '...' : userAgent;
  };

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

  const getUniqueIPs = () => {
    const uniqueIPs = new Set(data?.logs.map(log => log.ipAddress));
    return Array.from(uniqueIPs);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="self-start sm:mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <List className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Log Entries</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">View all IP access attempts and visitor data</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Live Monitoring</span>
              </div>
              <Button 
                onClick={handleExportLogs}
                className="bg-primary text-primary-foreground hover:bg-primary/90 self-start sm:self-auto min-h-[44px] animate-button"
                data-testid="button-export-logs"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
              </header>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{data?.total || 0}</div>
                <p className="text-sm text-muted-foreground">All access attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unique IPs</CardTitle>
              </header>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{getUniqueIPs().length}</div>
                <p className="text-sm text-muted-foreground">Different visitors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
              </header>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {data?.logs.filter(log => 
                    new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Log Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Access Log Details</span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search logs..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full sm:w-80 bg-input border-border text-foreground placeholder-muted-foreground"
                      data-testid="input-search-logs"
                    />
                  </div>
                  <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:flex-shrink-0 animate-button">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
              <CardDescription>
                Real-time monitoring of all IP logger access attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">IP Address</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Location</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">User Agent</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Referrer</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          {search ? "No entries match your search." : "No log entries found. Access /image.jpg to generate logs."}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-log-${log.id}`}>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground" data-testid={`text-timestamp-${log.id}`}>
                            <div className="flex flex-col">
                              <span className="font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm font-mono text-foreground" data-testid={`text-ip-${log.id}`}>
                            <div className="flex flex-col space-y-1">
                              <span className="font-medium break-all">{log.ipAddress}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs w-fit animate-button"
                                onClick={() => {
                                  navigator.clipboard.writeText(log.ipAddress);
                                  toast({ title: "Copied!", description: "IP address copied to clipboard" });
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground" data-testid={`text-location-${log.id}`}>
                            <div className="flex flex-col">
                              <span className="font-medium">{log.location}</span>
                              <div className="md:hidden space-y-1 pt-1">
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={log.userAgent}>
                                  {truncateUserAgent(log.userAgent, 40)}
                                </div>
                                <div className="lg:hidden text-xs text-muted-foreground">
                                  {log.referrer && log.referrer !== '-' ? `Ref: ${log.referrer.length > 20 ? log.referrer.substring(0, 20) + '...' : log.referrer}` : 'Direct'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm max-w-xs text-foreground hidden md:table-cell" data-testid={`text-user-agent-${log.id}`}>
                            <span title={log.userAgent}>{truncateUserAgent(log.userAgent)}</span>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground hidden lg:table-cell" data-testid={`text-referrer-${log.id}`}>
                            {log.referrer || 'Direct'}
                          </td>
                          <td className="p-2 sm:p-4" data-testid={`status-${log.id}`}>
                            <Badge 
                              variant={log.status === 'success' ? 'default' : 'destructive'}
                              className={log.status === 'success' 
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs' 
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs'
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Showing {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}-{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0} entries
                </p>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-border animate-button"
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum 
                            ? "bg-primary text-primary-foreground" 
                            : "border-border"
                          }
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-border animate-button"
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}