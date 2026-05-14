import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Download, List, Eye, Copy, MapPin, Monitor, Clock, Wifi } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { useToast } from "@/hooks/use-toast";

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

const CY = {
  bg: "rgba(0,6,12,0.7)",
  border: "rgba(0,245,255,0.15)",
  cyan: "#00f5ff",
  green: "#00ff9f",
  red: "#ff5050",
  yellow: "#ffc800",
  purple: "#a050ff",
  font: "Orbitron, sans-serif",
  mono: "JetBrains Mono, monospace",
};

function CyberInput({ value, onChange, placeholder, icon: Icon }: any) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,245,255,0.4)" }} />}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full py-2 pr-3 text-xs outline-none transition-all"
        style={{
          paddingLeft: Icon ? "32px" : "12px",
          background: "rgba(0,245,255,0.04)",
          border: "1px solid rgba(0,245,255,0.2)",
          color: "#e0f8ff",
          fontFamily: CY.mono,
          fontSize: "11px",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0,245,255,0.08)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function CyberBtn({ children, onClick, disabled, variant = "primary", small }: any) {
  const v: Record<string, any> = {
    primary:  { bg: "rgba(0,245,255,0.08)",  border: "rgba(0,245,255,0.3)",  color: "#00f5ff" },
    success:  { bg: "rgba(0,255,159,0.08)",  border: "rgba(0,255,159,0.3)",  color: "#00ff9f" },
    ghost:    { bg: "transparent",           border: "rgba(0,245,255,0.15)", color: "rgba(0,245,255,0.5)" },
  };
  const s = v[variant] || v.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 ${small ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"} font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </button>
  );
}

export default function LogEntries() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const logsPerPage = 25;

  const { data, isLoading } = useQuery<LogsResponse>({
    queryKey: ["logs", { limit: logsPerPage, offset: (currentPage - 1) * logsPerPage }],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/logs?limit=${logsPerPage}&offset=${(currentPage - 1) * logsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    refetchInterval: 2000,
  });

  const filteredLogs = data?.logs.filter(l =>
    l.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
    l.userAgent.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((data?.total || 0) / logsPerPage);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ip_logs.csv" });
      a.click();
      toast({ title: "EXPORT COMPLETE" });
    } catch {
      toast({ title: "EXPORT FAILED", variant: "destructive" });
    }
  };

  const uniqueIPs = new Set(data?.logs.map(l => l.ipAddress)).size;
  const recent24h = data?.logs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 86400000)).length || 0;

  const statCards = [
    { label: "TOTAL ENTRIES",   value: data?.total || 0,  color: CY.cyan,   icon: List },
    { label: "UNIQUE IPs",      value: uniqueIPs,          color: CY.green,  icon: Wifi },
    { label: "LAST 24H",        value: recent24h,          color: CY.yellow, icon: Clock },
  ];

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed top-0 right-0 w-80 h-80 pointer-events-none z-0 opacity-15"
        style={{ background: "radial-gradient(circle at top right, rgba(0,255,159,0.3), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b flex-shrink-0"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(0,245,255,0.12)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.5) 30%, rgba(0,255,159,0.5) 70%, transparent)" }} />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <List className="w-4 h-4" style={{ color: CY.green, filter: "drop-shadow(0 0 6px #00ff9f)" }} />
                <h1 className="text-base md:text-lg font-black tracking-widest"
                  style={{ fontFamily: CY.font, color: CY.green, textShadow: "0 0 15px rgba(0,255,159,0.5)", letterSpacing: "0.2em" }}>
                  LOG ENTRIES
                </h1>
              </div>
              <p className="text-[10px] mt-0.5 ml-7 tracking-widest"
                style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                // REALTIME IP CAPTURE FEED — {data?.total || 0} RECORDS
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CY.green, boxShadow: `0 0 6px ${CY.green}` }} />
                <span className="text-[10px] tracking-widest" style={{ color: "rgba(0,255,159,0.6)", fontFamily: CY.mono }}>LIVE</span>
              </div>
              <CyberBtn onClick={handleExport} variant="success">
                <Download className="w-3 h-3" />
                EXPORT CSV
              </CyberBtn>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-3 md:p-4 relative overflow-hidden"
                  style={{ background: CY.bg, border: `1px solid ${s.color}25` }}>
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${s.color}15, transparent 70%)` }} />
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" style={{ color: s.color }} />
                    <span className="text-[8px] md:text-[9px] tracking-widest uppercase"
                      style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.15em" }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="text-xl md:text-2xl font-black"
                    style={{ color: s.color, fontFamily: CY.font, textShadow: `0 0 10px ${s.color}66` }}>
                    {s.value.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search + table */}
          <div style={{ background: CY.bg, border: `1px solid ${CY.border}` }}>
            {/* Table header */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "rgba(0,245,255,0.08)", background: "rgba(0,8,20,0.6)" }}>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" style={{ color: CY.cyan }} />
                <span className="text-[10px] font-bold tracking-widest"
                  style={{ fontFamily: CY.font, color: CY.cyan, letterSpacing: "0.2em" }}>
                  ACCESS LOG DETAILS
                </span>
              </div>
              <div className="w-48 md:w-64">
                <CyberInput
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  placeholder="// search IPs, locations..."
                  icon={Search}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr style={{ background: "rgba(0,245,255,0.03)", borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
                    {["TIME", "IP ADDRESS", "LOCATION", "USER AGENT", "REFERRER", "STATUS"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[9px] font-bold tracking-widest"
                        style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.2em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,245,255,0.05)" }}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-3 py-3">
                            <div className="h-3 animate-pulse" style={{ background: "rgba(0,245,255,0.05)", width: `${40 + Math.random() * 40}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-16 text-center">
                        <div className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.font }}>
                          {search ? "NO ENTRIES MATCH FILTER" : "NO LOG ENTRIES — ACCESS /image.jpg TO GENERATE LOGS"}
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.map((log, i) => (
                    <tr key={log.id}
                      className="transition-all duration-150 group"
                      style={{
                        borderBottom: "1px solid rgba(0,245,255,0.04)",
                        background: i % 2 === 0 ? "rgba(0,245,255,0.01)" : "transparent",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,245,255,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "rgba(0,245,255,0.01)" : "transparent")}
                    >
                      <td className="px-3 py-2.5">
                        <div className="text-[10px]" style={{ color: CY.cyan, fontFamily: CY.mono }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[9px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold" style={{ color: "#00ff9f", fontFamily: CY.mono }}>{log.ipAddress}</span>
                          <button onClick={() => { navigator.clipboard.writeText(log.ipAddress); toast({ title: "COPIED" }); }}
                            style={{ color: "rgba(0,245,255,0.3)", background: "none", border: "none", cursor: "pointer" }}>
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(0,245,255,0.3)" }} />
                          <span className="text-[10px]" style={{ color: "rgba(200,240,255,0.75)", fontFamily: CY.mono }}>{log.location || "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell max-w-[200px]">
                        <span className="text-[9px] truncate block" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }} title={log.userAgent}>
                          {log.userAgent.length > 60 ? log.userAgent.slice(0, 60) + "…" : log.userAgent}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <span className="text-[9px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                          {log.referrer || "Direct"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] px-2 py-0.5 font-bold tracking-widest"
                          style={{
                            color: log.status === "success" ? CY.green : CY.red,
                            background: log.status === "success" ? "rgba(0,255,159,0.1)" : "rgba(255,80,80,0.1)",
                            border: `1px solid ${log.status === "success" ? "rgba(0,255,159,0.3)" : "rgba(255,80,80,0.3)"}`,
                            fontFamily: CY.font,
                            letterSpacing: "0.1em",
                          }}>
                          {log.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: "rgba(0,245,255,0.08)", background: "rgba(0,8,20,0.4)" }}>
              <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}–{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0}
              </span>
              <div className="flex items-center gap-1.5">
                <CyberBtn small variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-3 h-3" />
                  PREV
                </CyberBtn>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const n = i + 1;
                  return (
                    <button key={n} onClick={() => setCurrentPage(n)}
                      className="w-7 h-7 text-[9px] font-bold transition-all"
                      style={{
                        background: currentPage === n ? "rgba(0,245,255,0.15)" : "transparent",
                        border: `1px solid ${currentPage === n ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.1)"}`,
                        color: currentPage === n ? CY.cyan : "rgba(0,245,255,0.4)",
                        fontFamily: CY.font,
                        cursor: "pointer",
                      }}>
                      {n}
                    </button>
                  );
                })}
                <CyberBtn small variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  NEXT
                  <ChevronRight className="w-3 h-3" />
                </CyberBtn>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
