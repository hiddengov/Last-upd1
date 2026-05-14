import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import MetricsGrid from "../components/dashboard/metrics-grid";
import LogTable from "../components/dashboard/log-table";
import IPChecker from "../components/dashboard/ip-checker";
import { Download, Activity, Globe, BarChart3, FileText, Cpu, Radio } from "lucide-react";
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
    refetchInterval: 30000,
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
      toast({ title: "EXPORT COMPLETE", description: "IP logs exported to CSV." });
    } catch {
      toast({ title: "EXPORT FAILED", description: "Failed to export logs.", variant: "destructive" });
    }
  };

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: BarChart3 },
    { id: 'ip-checker', label: 'IP LOOKUP', icon: Globe },
    { id: 'logs', label: 'LOG FEED', icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#000508' }}>
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-6 py-4 border-b"
          style={{
            background: 'rgba(0, 4, 12, 0.95)',
            borderColor: 'rgba(0,245,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Top glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)' }}
          />

          <div className="flex items-center justify-between">
            <div className="animate-fade-in-down">
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4" style={{ color: '#00f5ff', filter: 'drop-shadow(0 0 4px #00f5ff)' }} />
                <h2 className="text-lg font-black tracking-widest"
                  style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 15px rgba(0,245,255,0.5)', letterSpacing: '0.2em' }}>
                  CONTROL CENTER
                </h2>
              </div>
              <p className="text-xs mt-0.5 ml-7"
                style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                IP Intelligence & Monitoring System
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff9f', boxShadow: '0 0 8px #00ff9f' }} />
                <span className="text-xs" style={{ color: 'rgba(0,255,159,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                  SYSTEM ACTIVE
                </span>
              </div>

              <button onClick={handleExportLogs}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest transition-all duration-300"
                style={{
                  background: 'rgba(0,245,255,0.08)',
                  border: '1px solid rgba(0,245,255,0.3)',
                  color: '#00f5ff',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '0.15em',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(0,245,255,0.15)';
                  el.style.boxShadow = '0 0 20px rgba(0,245,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(0,245,255,0.08)';
                  el.style.boxShadow = 'none';
                }}
              >
                <Download className="h-3.5 w-3.5" />
                EXPORT
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 mt-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest transition-all duration-200 relative"
                  style={{
                    background: isActive ? 'rgba(0,245,255,0.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(0,245,255,0.4)' : 'transparent'}`,
                    borderBottom: isActive ? '1px solid rgba(0,245,255,0.4)' : '1px solid transparent',
                    color: isActive ? '#00f5ff' : 'rgba(0,245,255,0.35)',
                    fontFamily: 'Orbitron, sans-serif',
                    letterSpacing: '0.15em',
                    cursor: 'pointer',
                    textShadow: isActive ? '0 0 10px rgba(0,245,255,0.5)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(0,245,255,0.65)'; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(0,245,255,0.35)'; }}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: '#00f5ff', boxShadow: '0 0 6px #00f5ff' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </header>

        <div className="p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
              <MetricsGrid metrics={metrics} isLoading={metricsLoading} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Activity panel */}
                <div className="lg:col-span-2 rounded-none overflow-hidden"
                  style={{ background: 'rgba(0,5,15,0.95)', border: '1px solid rgba(0,245,255,0.12)' }}>
                  <div className="p-5 border-b flex items-center justify-between"
                    style={{ borderColor: 'rgba(0,245,255,0.08)', background: 'rgba(0,8,20,0.7)' }}>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" style={{ color: '#00f5ff' }} />
                      <h3 className="text-xs font-bold tracking-widest"
                        style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', letterSpacing: '0.2em' }}>
                        ACTIVITY MONITOR
                      </h3>
                    </div>
                    <select className="text-xs px-2 py-1"
                      style={{
                        background: 'rgba(0,245,255,0.04)',
                        border: '1px solid rgba(0,245,255,0.15)',
                        color: 'rgba(0,245,255,0.6)',
                        fontFamily: 'JetBrains Mono, monospace',
                        outline: 'none'
                      }}>
                      <option>Last 24 hours</option>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <div className="p-5">
                    <div className="h-52 flex items-center justify-center border"
                      style={{ borderColor: 'rgba(0,245,255,0.08)', background: 'rgba(0,245,255,0.02)' }}>
                      <div className="text-center">
                        <div className="relative w-12 h-12 mx-auto mb-3">
                          <Radio className="h-12 w-12 animate-pulse" style={{ color: 'rgba(0,245,255,0.2)' }} />
                          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
                        </div>
                        <p className="text-xs font-bold tracking-widest" style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'Orbitron, sans-serif', fontSize: '10px', letterSpacing: '0.2em' }}>
                          REALTIME MONITORING
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(0,245,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                          {metrics?.totalRequests?.toLocaleString() || '0'} total events captured
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Status panel */}
                <div className="rounded-none overflow-hidden"
                  style={{ background: 'rgba(0,5,15,0.95)', border: '1px solid rgba(0,245,255,0.12)' }}>
                  <div className="p-5 border-b" style={{ borderColor: 'rgba(0,245,255,0.08)', background: 'rgba(0,8,20,0.7)' }}>
                    <h3 className="text-xs font-bold tracking-widest"
                      style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', letterSpacing: '0.2em' }}>
                      TRACKER STATUS
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { label: 'PAYLOAD', value: 'decoy_pixel.gif' },
                      { label: 'SIZE', value: '43 B' },
                      { label: 'FORMAT', value: 'GIF' },
                      { label: 'STATUS', value: 'ACTIVE', color: '#00ff9f', glow: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em' }}>
                          {item.label}
                        </span>
                        <span className="text-xs font-semibold"
                          style={{
                            color: item.color || 'rgba(180,220,255,0.8)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '10px',
                            textShadow: item.glow ? `0 0 8px ${item.color}` : 'none'
                          }}>
                          {item.value}
                        </span>
                      </div>
                    ))}

                    <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(0,245,255,0.08)' }}>
                      <p className="text-xs mb-2" style={{ color: 'rgba(0,245,255,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em' }}>
                        PAYLOAD PREVIEW
                      </p>
                      <div className="h-16 flex items-center justify-center"
                        style={{ background: 'rgba(0,245,255,0.02)', border: '1px solid rgba(0,245,255,0.1)' }}>
                        <span className="text-xs" style={{ color: 'rgba(0,245,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                          1×1 TRANSPARENT PIXEL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ip-checker' && (
            <div className="animate-fade-in-up">
              <IPChecker />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-fade-in-up">
              <LogTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
