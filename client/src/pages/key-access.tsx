import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeyAccessProps {
  onAccessGranted: () => void;
}

function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded" style={{ zIndex: 1 }}>
      <div className="absolute left-0 right-0 h-0.5 opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)',
          animation: 'scan-line 3s linear infinite',
        }}
      />
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function KeyAccess({ onAccessGranted }: KeyAccessProps) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [typedChars, setTypedChars] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (accessKey.length > typedChars) setTypedChars(accessKey.length);
  }, [accessKey]);

  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) { setError("ACCESS CODE REQUIRED"); return; }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: accessKey.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "ACCESS GRANTED", description: "Welcome to .GOV Intelligence System" });
        onAccessGranted();
      } else {
        setError(data.error?.toUpperCase() || "INVALID ACCESS CODE");
        if (data.error === "Access key expired") {
          setAccessKey("");
          toast({ title: "ACCESS DENIED", description: "Key expired. Contact administrator.", variant: "destructive" });
        }
      }
    } catch { setError("CONNECTION FAILURE. RETRY."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#000508' }}>
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,245,255,0.05) 0%, transparent 65%)' }}
      />

      {/* Diagonal lines */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(0,245,255,0.03) 60px, rgba(0,245,255,0.03) 61px)'
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Top GOV Badge */}
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-block mb-5">
            <div className="relative">
              <div className="w-24 h-24 mx-auto flex items-center justify-center relative">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-spin-slow" />
                <div className="absolute inset-1 rounded-full border border-cyan-400/20" style={{ animation: 'spin 8s linear infinite reverse' }} />

                {/* GOV Hexagon */}
                <div className="w-20 h-20 flex items-center justify-center relative"
                  style={{
                    background: 'rgba(0,8,20,0.9)',
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    border: '2px solid #00f5ff',
                    boxShadow: '0 0 30px rgba(0,245,255,0.4), inset 0 0 20px rgba(0,245,255,0.05)'
                  }}
                >
                  <span className="text-2xl font-black" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 20px #00f5ff' }}>
                    GOV
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-[0.4em] mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.6)' }}>
            KEY SYSTEM
          </h1>
          <p className="text-xs tracking-[0.5em] uppercase" style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            SECURE ACCESS PROTOCOL
          </p>
        </div>

        {/* Card */}
        <div className="relative animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="relative"
            style={{
              background: 'rgba(0,8,20,0.92)',
              border: '1px solid rgba(0,245,255,0.25)',
              borderRadius: '4px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(0,245,255,0.06), 0 40px 80px rgba(0,0,0,0.6)'
            }}
          >
            <ScanLine />

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: '#00f5ff' }} />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: '#00f5ff' }} />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: '#00f5ff' }} />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: '#00f5ff' }} />

            <div className="p-8" style={{ position: 'relative', zIndex: 2 }}>
              {/* Status indicators */}
              <div className="space-y-2 mb-6">
                {[
                  { label: 'SECURE CHANNEL', ok: true },
                  { label: 'ONE-TIME VERIFICATION', ok: true },
                  { label: 'ENCRYPTED TRANSMISSION', ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #00ff9f' }} />
                    <span className="text-xs tracking-widest" style={{ color: 'rgba(0,245,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,245,255,0.1), transparent)' }} />
                    <span className="text-xs" style={{ color: '#00ff9f', fontFamily: 'JetBrains Mono, monospace' }}>OK</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)' }} />

              {error && (
                <div className="mb-5 p-3 flex items-center gap-3 animate-shake"
                  style={{ background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '2px' }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#ff6b6b' }} />
                  <span className="text-xs font-mono" style={{ color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAccess} className="space-y-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(0,245,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                    // ACCESS TOKEN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full px-4 py-3 text-sm text-center tracking-[0.3em] rounded-none"
                      style={{
                        background: 'rgba(0,245,255,0.04)',
                        border: '1px solid rgba(0,245,255,0.2)',
                        color: '#00f5ff',
                        fontFamily: 'JetBrains Mono, monospace',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        letterSpacing: '0.3em'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#00f5ff'; e.target.style.boxShadow = '0 0 20px rgba(0,245,255,0.15)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(0,245,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full py-3 text-sm font-black tracking-widest uppercase relative overflow-hidden"
                  style={{
                    background: isLoading ? 'rgba(0,245,255,0.05)' : 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(59,130,246,0.12))',
                    border: '1px solid rgba(0,245,255,0.5)',
                    color: isLoading ? 'rgba(0,245,255,0.4)' : '#00f5ff',
                    fontFamily: 'Orbitron, sans-serif',
                    letterSpacing: '0.25em',
                    clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 20px rgba(0,245,255,0.2)'
                  }}
                  onMouseEnter={(e) => { if (!isLoading) { const el = e.currentTarget; el.style.boxShadow = '0 0 40px rgba(0,245,255,0.5)'; el.style.background = 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(59,130,246,0.2))'; } }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.boxShadow = '0 0 20px rgba(0,245,255,0.2)'; el.style.background = 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(59,130,246,0.12))'; }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      VERIFYING...
                    </span>
                  ) : '[ VERIFY ACCESS ]'}
                </button>
              </form>

              {/* Bottom info */}
              <div className="mt-6 pt-5 border-t text-center space-y-1" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
                <p className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Contact administrator for access code
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,200,0,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                  ⚠ Each token is single-use unless permanent
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
