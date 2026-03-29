import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Terminal, Wifi, WifiOff } from "lucide-react";
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
    refetchInterval: 2000,
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

  if (isLoading) {
    return (
      <div className="rounded-none" style={{ background: 'rgba(0,6,18,0.9)', border: '1px solid rgba(0,245,255,0.12)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <Skeleton className="h-5 w-40" style={{ background: 'rgba(0,245,255,0.1)' }} />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" style={{ background: 'rgba(0,245,255,0.05)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-none overflow-hidden" style={{ background: 'rgba(0,5,15,0.95)', border: '1px solid rgba(0,245,255,0.15)' }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)', background: 'rgba(0,8,20,0.8)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4" style={{ color: '#00f5ff', filter: 'drop-shadow(0 0 4px #00f5ff)' }} />
            <h3 className="text-sm font-bold tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', letterSpacing: '0.2em' }}>
              IP LOG FEED
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px #00ff9f' }} />
              <span className="text-xs" style={{ color: 'rgba(0,255,159,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>LIVE</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'rgba(0,245,255,0.4)' }} />
            <input
              type="text"
              placeholder="search_logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-none w-full sm:w-56"
              style={{
                background: 'rgba(0,245,255,0.04)',
                border: '1px solid rgba(0,245,255,0.2)',
                color: '#00f5ff',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#00f5ff'; e.target.style.boxShadow = '0 0 15px rgba(0,245,255,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,245,255,0.2)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr style={{ background: 'rgba(0,245,255,0.03)', borderBottom: '1px solid rgba(0,245,255,0.08)' }}>
              {['TIMESTAMP', 'IP & VPN', 'LOCATION', 'DEVICE', 'STATUS'].map((h) => (
                <th key={h} className="p-3 text-left text-xs font-bold tracking-widest"
                  style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.2em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Terminal className="h-8 w-8" style={{ color: 'rgba(0,245,255,0.2)' }} />
                    <p className="text-xs" style={{ color: 'rgba(0,245,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      NO LOG ENTRIES FOUND
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(0,245,255,0.15)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                      Access /image.jpg to capture your first entry
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id}
                  className="group transition-all duration-200"
                  style={{ borderBottom: '1px solid rgba(0,245,255,0.05)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,245,255,0.03)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs" style={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono font-semibold break-all"
                        style={{ color: '#00f5ff', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', textShadow: '0 0 8px rgba(0,245,255,0.3)' }}>
                        {log.ipAddress}
                      </span>
                      {log.isVpn === 'yes' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 w-fit"
                          style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em' }}>
                          <WifiOff className="w-2.5 h-2.5" /> VPN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 w-fit"
                          style={{ background: 'rgba(0,255,159,0.08)', border: '1px solid rgba(0,255,159,0.25)', color: '#00ff9f', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em' }}>
                          <Wifi className="w-2.5 h-2.5" /> DIRECT
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium" style={{ color: 'rgba(180,220,255,0.8)', fontFamily: 'Rajdhani, sans-serif' }}>
                        {log.location}
                      </span>
                      {log.isVpn === 'yes' && log.realLocation && (
                        <span className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                          real: {log.realLocation}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs" style={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                        {log.deviceType || 'Unknown'} / {log.browserName || '?'}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(0,245,255,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                        {log.operatingSystem || 'Unknown OS'}
                      </span>
                    </div>
                  </td>

                  <td className="p-3">
                    {log.status === 'discord_token_captured' ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold"
                        style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.4)', color: '#ff4444', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em' }}>
                        🔥 TOKEN
                      </span>
                    ) : log.status === 'success' ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs"
                        style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', color: 'rgba(0,245,255,0.7)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                        {log.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderColor: 'rgba(0,245,255,0.08)', background: 'rgba(0,8,20,0.6)' }}>
        <span className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
          {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}-{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0} entries
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || !data?.total}
            className="flex items-center gap-1 px-3 py-1.5 text-xs transition-all duration-200"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
              color: currentPage === 1 ? 'rgba(0,245,255,0.2)' : 'rgba(0,245,255,0.6)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => { if (currentPage !== 1) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.4)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.15)'; }}
          >
            <ChevronLeft className="h-3 w-3" />
            PREV
          </button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = i + 1;
            const isActive = currentPage === pageNum;
            return (
              <button key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className="w-7 h-7 text-xs transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(0,245,255,0.15)' : 'rgba(0,245,255,0.04)',
                  border: `1px solid ${isActive ? 'rgba(0,245,255,0.5)' : 'rgba(0,245,255,0.15)'}`,
                  color: isActive ? '#00f5ff' : 'rgba(0,245,255,0.4)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  boxShadow: isActive ? '0 0 10px rgba(0,245,255,0.2)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || !data?.total}
            className="flex items-center gap-1 px-3 py-1.5 text-xs transition-all duration-200"
            style={{
              background: 'rgba(0,245,255,0.04)',
              border: '1px solid rgba(0,245,255,0.15)',
              color: currentPage === totalPages ? 'rgba(0,245,255,0.2)' : 'rgba(0,245,255,0.6)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => { if (currentPage !== totalPages) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.4)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.15)'; }}
          >
            NEXT
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
