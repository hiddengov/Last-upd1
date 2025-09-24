
import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, ChevronLeft, ChevronRight, Download, Monitor, Eye, ArrowLeft, Activity } from 'lucide-react';
import Sidebar from "@/components/dashboard/sidebar";
import SnowEffect from "@/components/ui/snow-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ExeLog {
  id: string;
  exeName: string;
  exeDescription: string;
  exeVersion: string;
  features: string[];
  webhookUrl: string;
  stealth: boolean;
  autostart: boolean;
  persistence: boolean;
  generationStatus: string;
  downloadCount: number;
  exeId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  exeFileSize: number;
  createdAt: string;
}

interface ExeLogsResponse {
  logs: ExeLog[];
  total: number;
}

export default function ExeTracking() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const logsPerPage = 25;
  const [location, setLocation] = useLocation();

  const { data, isLoading } = useQuery<ExeLogsResponse>({
    queryKey: ['/api/exe-logs', { limit: logsPerPage, offset: (currentPage - 1) * logsPerPage }],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const filteredLogs = data?.logs.filter(log => 
    log.exeName.toLowerCase().includes(search.toLowerCase()) ||
    log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
    log.location.toLowerCase().includes(search.toLowerCase()) ||
    log.exeId.toLowerCase().includes(search.toLowerCase())
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'validation_failed': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background relative overflow-hidden">
        <SnowEffect color="#ffffff" glow={true} density={60} speed={1.2} />
        <Sidebar />
        <main className="flex-1 p-6 relative z-10">
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
    <div className="flex h-screen bg-background relative overflow-hidden">
      <SnowEffect color="#ffffff" glow={true} density={60} speed={1.2} />
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-4">
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
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">EXE Tracking</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Monitor all generated Windows executables and their activity</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">EXE Monitor Active</span>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total EXE Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{data?.total || 0}</div>
                <p className="text-sm text-muted-foreground">Generated executables</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {data?.logs.filter(log => log.generationStatus === 'success').length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Running executables</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stealth Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {data?.logs.filter(log => log.stealth).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Hidden executables</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {data?.logs.reduce((sum, log) => sum + log.downloadCount, 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">EXE deployments</p>
              </CardContent>
            </Card>
          </div>

          {/* EXE Logs Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  <span>EXE Generation Logs</span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search executables..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full sm:w-80 bg-input border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>
                  <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:flex-shrink-0">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
              <CardDescription>
                Real-time monitoring of all Windows executable generations and deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Executable</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Features</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Configuration</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Location</th>
                      <th className="text-left p-3 sm:p-4 text-sm font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          {search ? "No executables match your search." : "No executables generated yet. Visit EXE Generator to create one."}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                            <div className="flex flex-col space-y-1">
                              <span className="font-medium">{log.exeName}</span>
                              <span className="text-xs text-muted-foreground">v{log.exeVersion}</span>
                              <span className="text-xs text-muted-foreground font-mono">ID: {log.exeId.substring(0, 8)}...</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="flex flex-col space-y-2">
                              <Badge className={getStatusColor(log.generationStatus)}>
                                {log.generationStatus}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(log.exeFileSize)} • {log.downloadCount} deployed
                              </span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                            <div className="flex flex-wrap gap-1">
                              {log.features.slice(0, 3).map((feature) => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature.replace('_', ' ')}
                                </Badge>
                              ))}
                              {log.features.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{log.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                            <div className="flex flex-col space-y-1">
                              {log.stealth && (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30 w-fit">
                                  🔒 Stealth
                                </Badge>
                              )}
                              {log.autostart && (
                                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30 w-fit">
                                  🚀 Auto Start
                                </Badge>
                              )}
                              {log.persistence && (
                                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30 w-fit">
                                  🔄 Persistent
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                            <div className="flex flex-col space-y-1">
                              <span className="font-mono">{log.ipAddress}</span>
                              <span className="text-xs text-muted-foreground">{log.location}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                            <div className="flex flex-col">
                              <span className="font-mono">{new Date(log.createdAt).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
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
                  Showing {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}-{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0} executables
                </p>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-border"
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
                    className="border-border"
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
