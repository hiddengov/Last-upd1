import { useState } from "react";
import { Youtube, Link2, Copy, Eye, Play, Shield, CheckCircle, Target } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const CY = {
  font: "Orbitron, sans-serif",
  mono: "JetBrains Mono, monospace",
  cyan: "#00f5ff",
  green: "#00ff9f",
  red: "#ff5050",
  yellow: "#ffc800",
  purple: "#a050ff",
};

function CyberInput({ value, onChange, placeholder, type = "text" }: any) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-3 py-2.5 text-xs outline-none transition-all"
      style={{
        background: "rgba(0,245,255,0.04)",
        border: "1px solid rgba(0,245,255,0.2)",
        color: "#e0f8ff",
        fontFamily: CY.mono,
        fontSize: "12px",
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0,245,255,0.08)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function CyberBtn({ children, onClick, disabled, variant = "primary" }: any) {
  const v: Record<string, any> = {
    primary: { bg: "rgba(0,245,255,0.1)",  border: "rgba(0,245,255,0.4)",  color: "#00f5ff" },
    success: { bg: "rgba(0,255,159,0.08)", border: "rgba(0,255,159,0.4)",  color: "#00ff9f" },
    danger:  { bg: "rgba(255,50,50,0.08)", border: "rgba(255,80,80,0.4)",  color: "#ff5050" },
    warning: { bg: "rgba(255,200,0,0.08)", border: "rgba(255,200,0,0.4)",  color: "#ffc800" },
  };
  const s = v[variant] || v.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function Panel({ title, icon: Icon, color = CY.cyan, children, accent }: any) {
  return (
    <div style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${color}25` }}>
      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: `${color}18`, background: "rgba(0,8,20,0.6)" }}>
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        <span className="text-[11px] font-bold tracking-widest"
          style={{ fontFamily: CY.font, color, letterSpacing: "0.2em" }}>
          {title}
        </span>
        {accent}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function YoutubeProxy() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const generateTrackingLink = () => {
    if (!youtubeUrl.trim()) {
      toast({ title: "INVALID URL", description: "Please enter a YouTube URL", variant: "destructive" });
      return;
    }
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast({ title: "INVALID YOUTUBE URL", description: "Supported: youtube.com or youtu.be", variant: "destructive" });
      return;
    }
    const trackingId = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/yt/${trackingId}?v=${videoId}`;
    setGeneratedLink(link);
    toast({ title: "TRACKING LINK GENERATED" });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "COPIED TO CLIPBOARD" });
    } catch {
      toast({ title: "COPY FAILED", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at top right, rgba(255,50,50,0.25), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(255,50,50,0.2)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,50,50,0.6) 30%, rgba(255,200,0,0.6) 70%, transparent)" }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Youtube className="w-4 h-4" style={{ color: CY.red, filter: "drop-shadow(0 0 6px rgba(255,50,50,0.8))" }} />
              <div>
                <h1 className="text-base md:text-lg font-black tracking-widest"
                  style={{ fontFamily: CY.font, color: CY.red, textShadow: "0 0 15px rgba(255,50,50,0.5)", letterSpacing: "0.2em" }}>
                  YOUTUBE PROXY
                </h1>
                <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                  // SOCIAL ENGINEERING TRACKING VECTOR
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5"
              style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.3)" }}>
              <Shield className="w-3 h-3" style={{ color: CY.red }} />
              <span className="text-[9px] font-bold tracking-widest" style={{ color: CY.red, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                SEC TESTING
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4 max-w-3xl">
          {/* How it works */}
          <Panel title="HOW IT WORKS" icon={Play} color={CY.yellow}>
            <div className="space-y-2.5">
              {[
                "Paste any YouTube video URL (youtube.com or youtu.be format)",
                "Click GENERATE to create a disguised tracking link",
                "Share the link — when clicked, visitor IP data is logged then redirected to the real video",
                "Monitor captured data in the Log Entries section",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[9px] font-black mt-0.5"
                    style={{ background: "rgba(255,200,0,0.12)", border: "1px solid rgba(255,200,0,0.4)", color: CY.yellow, fontFamily: CY.font }}>
                    {i + 1}
                  </span>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(200,240,255,0.7)", fontFamily: "Rajdhani, sans-serif" }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* URL Input */}
          <Panel title="YOUTUBE VIDEO URL" icon={Youtube} color={CY.red}>
            <div className="space-y-4">
              <div>
                <span className="block mb-1.5 text-[9px] tracking-widest uppercase"
                  style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.2em" }}>
                  TARGET URL
                </span>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <CyberInput
                      type="url"
                      value={youtubeUrl}
                      onChange={(e: any) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  <CyberBtn onClick={generateTrackingLink} variant="danger">
                    <Link2 className="w-3 h-3" />
                    GENERATE
                  </CyberBtn>
                </div>
              </div>
              <div className="text-[10px] space-y-1" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>
                <div style={{ color: "rgba(0,245,255,0.4)" }}>// SUPPORTED FORMATS:</div>
                <div>• https://www.youtube.com/watch?v=VIDEO_ID</div>
                <div>• https://youtu.be/VIDEO_ID</div>
                <div>• https://youtube.com/embed/VIDEO_ID</div>
              </div>
            </div>
          </Panel>

          {/* Generated link */}
          {generatedLink && (
            <Panel title="TRACKING LINK GENERATED" icon={Target} color={CY.green}
              accent={
                <span className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CY.green, boxShadow: `0 0 4px ${CY.green}` }} />
                  <span className="text-[9px]" style={{ color: CY.green, fontFamily: CY.font, letterSpacing: "0.1em" }}>ACTIVE</span>
                </span>
              }
            >
              <div className="space-y-4">
                {/* Link display */}
                <div className="flex items-center gap-2 p-3"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,159,0.25)" }}>
                  <code className="flex-1 text-[11px] break-all" style={{ color: CY.green, fontFamily: CY.mono }}>
                    {generatedLink}
                  </code>
                  <button onClick={() => copy(generatedLink)}
                    className="flex-shrink-0 p-1.5 transition-all hover:scale-110"
                    style={{ background: "rgba(0,255,159,0.1)", border: "1px solid rgba(0,255,159,0.3)", cursor: "pointer" }}>
                    <Copy className="w-3.5 h-3.5" style={{ color: CY.green }} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3" style={{ background: "rgba(0,255,159,0.04)", border: "1px solid rgba(0,255,159,0.1)" }}>
                    <div className="text-[9px] font-bold tracking-widest mb-2" style={{ color: CY.green, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                      WHAT HAPPENS
                    </div>
                    {["Captures visitor IP address", "Logs location & device info", "Redirects to actual YouTube video", "Video plays normally"].map(item => (
                      <div key={item} className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" style={{ color: CY.green }} />
                        <span className="text-[10px]" style={{ color: "rgba(0,255,159,0.7)", fontFamily: CY.mono }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.1)" }}>
                    <div className="text-[9px] font-bold tracking-widest mb-2" style={{ color: CY.cyan, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                      USE CASES
                    </div>
                    {["Security testing", "Social engineering awareness", "Phishing education", "IP geolocation testing"].map(item => (
                      <div key={item} className="flex items-center gap-1.5 mb-1">
                        <Target className="w-2.5 h-2.5 flex-shrink-0" style={{ color: CY.cyan }} />
                        <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.6)", fontFamily: CY.mono }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <CyberBtn onClick={() => window.open(generatedLink, "_blank")} variant="primary">
                    <Play className="w-3 h-3" />
                    TEST LINK
                  </CyberBtn>
                  <CyberBtn onClick={() => setLocation("/logs")} variant="success">
                    <Eye className="w-3 h-3" />
                    VIEW LOGS
                  </CyberBtn>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </main>
    </div>
  );
}
