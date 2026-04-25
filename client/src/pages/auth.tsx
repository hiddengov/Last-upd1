import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle, Eye, EyeOff, KeyRound, Copy, ShieldCheck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/\\~`';
    const cols = Math.floor(canvas.width / 18);
    const drops: number[] = Array(cols).fill(1);
    const interval = setInterval(() => {
      ctx.fillStyle = 'rgba(0, 5, 15, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
      ctx.font = '13px JetBrains Mono, monospace';
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.95 ? 'rgba(0, 255, 159, 0.8)' : 'rgba(0, 245, 255, 0.12)';
        ctx.fillText(char, i * 18, drops[i] * 18);
        if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 50);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [glitchActive, setGlitchActive] = useState(false);
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" });
  const [encProfileName, setEncProfileName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<{ username: string; encryptionKey: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) { setError("CREDENTIALS REQUIRED"); return; }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({ title: "ACCESS GRANTED", description: `Welcome, ${data.user.username}` });
        onLogin(data.token, data.user);
      } else {
        setError(data.error || "ACCESS DENIED");
      }
    } catch { setError("CONNECTION ERROR. RETRY."); }
    finally { setIsLoading(false); }
  };

  const handleEncryptedRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encProfileName.trim()) { setError("PROFILE NAME REQUIRED"); return; }
    if (encProfileName.trim().length < 3) { setError("MINIMUM 3 CHARACTERS"); return; }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/register-encrypted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName: encProfileName.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedKey({ username: data.username, encryptionKey: data.encryptionKey });
        toast({ title: "ENCRYPTED ACCOUNT INITIALIZED", description: "Save your key — it cannot be recovered." });
      } else {
        setError(data.error || "REGISTRATION FAILED");
      }
    } catch { setError("CONNECTION ERROR. RETRY."); }
    finally { setIsLoading(false); }
  };

  const copyKey = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "COPIED", description: "Encryption key copied to clipboard" });
    } catch {
      toast({ title: "COPY FAILED", description: "Use the download button instead", variant: "destructive" });
    }
  };

  const downloadKey = () => {
    if (!generatedKey) return;
    const content = `.GOV V8 // ENCRYPTED CREDENTIALS
================================================
Profile Name : ${generatedKey.username}
Encryption Key:
${generatedKey.encryptionKey}
================================================
KEEP THIS FILE SAFE. The encryption key IS your login.
Use the profile name and encryption key on the LOGIN tab.
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gov_v8_${generatedKey.username}_credentials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const useGeneratedKeyForLogin = () => {
    if (!generatedKey) return;
    setLoginData({ username: generatedKey.username, password: generatedKey.encryptionKey });
    setActiveTab("login");
    setGeneratedKey(null);
    setEncProfileName("");
    toast({ title: "READY", description: "Credentials prefilled. Click AUTHENTICATE." });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password) { setError("ALL FIELDS REQUIRED"); return; }
    if (registerData.password !== registerData.confirmPassword) { setError("PASSWORDS DO NOT MATCH"); return; }
    if (registerData.password.length < 6) { setError("MINIMUM 6 CHARACTERS"); return; }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerData.username, password: registerData.password }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "ACCOUNT INITIALIZED", description: "Credentials registered. Proceed to login." });
        setRegisterData({ username: "", password: "", confirmPassword: "" });
        setActiveTab("login");
      } else {
        setError(data.error || "REGISTRATION FAILED");
      }
    } catch { setError("CONNECTION ERROR. RETRY."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#000508' }}>
      <MatrixRain />

      {/* Background grid overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Radial glow */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,245,255,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in-up">
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 relative">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-spin-slow" />
            <div className="absolute inset-2 rounded-full border border-cyan-400/20" style={{ animation: 'spin 6s linear infinite reverse' }} />
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(59,130,246,0.15))',
                border: '1px solid rgba(0,245,255,0.5)',
                boxShadow: '0 0 30px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1), inset 0 0 20px rgba(0,245,255,0.05)'
              }}
            >
              <span className="text-xl font-black tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 20px #00f5ff' }}>
                GOV
              </span>
            </div>
          </div>

          <h1 className={`text-3xl font-black tracking-[0.3em] mb-1 ${glitchActive ? 'glitch' : ''}`}
            data-text=".GOV SYSTEM"
            style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.7)', letterSpacing: '0.3em' }}
          >
            .GOV SYSTEM
          </h1>
          <p className="text-xs tracking-[0.4em] uppercase mt-2" style={{ color: 'rgba(0,245,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
            IP Intelligence Platform
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.4))' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px #00ff9f' }} />
            <span className="text-xs" style={{ color: 'rgba(0,255,159,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>SYSTEM ONLINE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px #00ff9f' }} />
            <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(0,245,255,0.4), transparent)' }} />
          </div>
        </div>

        {/* Main Card */}
        <div className="relative" style={{
          background: 'rgba(0, 8, 20, 0.92)',
          border: '1px solid rgba(0,245,255,0.25)',
          borderRadius: '4px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0,245,255,0.08), 0 40px 80px rgba(0,0,0,0.6)'
        }}>
          {/* Top line glow */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)' }} />
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: '#00f5ff' }} />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: '#00f5ff' }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: '#00f5ff' }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: '#00f5ff' }} />

          <div className="p-8">
            {error && (
              <div className="mb-6 p-3 border rounded animate-shake flex items-center gap-3"
                style={{ background: 'rgba(255,0,0,0.08)', borderColor: 'rgba(255,50,50,0.4)', color: '#ff6b6b' }}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: '#ff6b6b' }} />
                <span className="text-xs font-mono tracking-wide">{error}</span>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 p-1 rounded-none"
                style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)' }}>
                <TabsTrigger value="login"
                  className="rounded-none text-[10px] tracking-widest uppercase font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 transition-all duration-300"
                  style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.18em', color: 'rgba(0,245,255,0.4)' }}>
                  LOGIN
                </TabsTrigger>
                <TabsTrigger value="register"
                  className="rounded-none text-[10px] tracking-widest uppercase font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 transition-all duration-300"
                  style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.18em', color: 'rgba(0,245,255,0.4)' }}>
                  REGISTER
                </TabsTrigger>
                <TabsTrigger value="encrypted"
                  className="rounded-none text-[10px] tracking-widest uppercase font-bold data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 transition-all duration-300"
                  style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.18em', color: 'rgba(0,255,159,0.4)' }}>
                  ENCRYPTED
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-up">
                  <div>
                    <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                      // IDENTIFIER
                    </label>
                    <input
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      placeholder="enter_username"
                      className="w-full px-4 py-3 text-sm rounded-none"
                      style={{
                        background: 'rgba(0,245,255,0.04)',
                        border: '1px solid rgba(0,245,255,0.2)',
                        color: '#00f5ff',
                        fontFamily: 'JetBrains Mono, monospace',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#00f5ff'; e.target.style.boxShadow = '0 0 15px rgba(0,245,255,0.15)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(0,245,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                      // AUTH KEY
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        placeholder="••••••••••"
                        className="w-full px-4 py-3 pr-12 text-sm rounded-none"
                        style={{
                          background: 'rgba(0,245,255,0.04)',
                          border: '1px solid rgba(0,245,255,0.2)',
                          color: '#00f5ff',
                          fontFamily: 'JetBrains Mono, monospace',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#00f5ff'; e.target.style.boxShadow = '0 0 15px rgba(0,245,255,0.15)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,245,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'rgba(0,245,255,0.4)' }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="w-full py-3 mt-2 text-sm font-black tracking-widest uppercase relative overflow-hidden transition-all duration-300"
                    style={{
                      background: isLoading ? 'rgba(0,245,255,0.05)' : 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(59,130,246,0.12))',
                      border: '1px solid rgba(0,245,255,0.5)',
                      color: isLoading ? 'rgba(0,245,255,0.5)' : '#00f5ff',
                      fontFamily: 'Orbitron, sans-serif',
                      letterSpacing: '0.25em',
                      clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 0 20px rgba(0,245,255,0.2)'
                    }}
                    onMouseEnter={(e) => { if (!isLoading) (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(0,245,255,0.5), 0 0 60px rgba(0,245,255,0.2)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = '0 0 20px rgba(0,245,255,0.2)'; }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        AUTHENTICATING...
                      </span>
                    ) : '[ AUTHENTICATE ]'}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5 animate-fade-in-up">
                  {['username', 'password', 'confirmPassword'].map((field, i) => (
                    <div key={field}>
                      <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                        // {field === 'username' ? 'NEW IDENTIFIER' : field === 'password' ? 'SET AUTH KEY' : 'CONFIRM KEY'}
                      </label>
                      <div className="relative">
                        <input
                          type={field === 'username' ? 'text' : (showPassword ? "text" : "password")}
                          value={registerData[field as keyof typeof registerData]}
                          onChange={(e) => setRegisterData({...registerData, [field]: e.target.value})}
                          placeholder={field === 'username' ? 'choose_username' : '••••••••••'}
                          className="w-full px-4 py-3 text-sm rounded-none"
                          style={{
                            background: 'rgba(0,245,255,0.04)',
                            border: '1px solid rgba(0,245,255,0.2)',
                            color: '#00f5ff',
                            fontFamily: 'JetBrains Mono, monospace',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#00f5ff'; e.target.style.boxShadow = '0 0 15px rgba(0,245,255,0.15)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(0,245,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                          disabled={isLoading}
                        />
                        {field !== 'username' && (
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'rgba(0,245,255,0.4)' }}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button type="submit" disabled={isLoading}
                    className="w-full py-3 mt-2 text-sm font-black tracking-widest uppercase relative overflow-hidden transition-all duration-300"
                    style={{
                      background: isLoading ? 'rgba(0,245,255,0.05)' : 'linear-gradient(135deg, rgba(0,255,159,0.1), rgba(0,245,255,0.1))',
                      border: '1px solid rgba(0,255,159,0.5)',
                      color: isLoading ? 'rgba(0,255,159,0.5)' : '#00ff9f',
                      fontFamily: 'Orbitron, sans-serif',
                      letterSpacing: '0.25em',
                      clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 0 20px rgba(0,255,159,0.15)'
                    }}
                    onMouseEnter={(e) => { if (!isLoading) (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(0,255,159,0.4), 0 0 60px rgba(0,255,159,0.15)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,159,0.15)'; }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                        INITIALIZING...
                      </span>
                    ) : '[ CREATE ACCOUNT ]'}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="encrypted">
                {!generatedKey ? (
                  <form onSubmit={handleEncryptedRegister} className="space-y-5 animate-fade-in-up">
                    <div className="p-3 border rounded flex items-start gap-3"
                      style={{ background: 'rgba(0,255,159,0.04)', borderColor: 'rgba(0,255,159,0.25)' }}>
                      <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#00ff9f' }} />
                      <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(180,255,220,0.75)', fontFamily: 'JetBrains Mono, monospace' }}>
                        Just pick a profile name. We generate a long encryption key — that key IS your password. No email, no recovery prompts.
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(0,255,159,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
                        // PROFILE NAME
                      </label>
                      <input
                        type="text"
                        value={encProfileName}
                        onChange={(e) => setEncProfileName(e.target.value)}
                        placeholder="agent_smith"
                        maxLength={32}
                        className="w-full px-4 py-3 text-sm rounded-none"
                        style={{
                          background: 'rgba(0,255,159,0.04)',
                          border: '1px solid rgba(0,255,159,0.25)',
                          color: '#00ff9f',
                          fontFamily: 'JetBrains Mono, monospace',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#00ff9f'; e.target.style.boxShadow = '0 0 15px rgba(0,255,159,0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,255,159,0.25)'; e.target.style.boxShadow = 'none'; }}
                        disabled={isLoading}
                      />
                      <p className="mt-2 text-[10px]" style={{ color: 'rgba(0,255,159,0.45)', fontFamily: 'JetBrains Mono, monospace' }}>
                        3-32 chars · letters, numbers, _ - . space
                      </p>
                    </div>

                    <button type="submit" disabled={isLoading}
                      className="w-full py-3 mt-2 text-sm font-black tracking-widest uppercase relative overflow-hidden transition-all duration-300"
                      style={{
                        background: isLoading ? 'rgba(0,255,159,0.05)' : 'linear-gradient(135deg, rgba(0,255,159,0.18), rgba(0,200,120,0.18))',
                        border: '1px solid rgba(0,255,159,0.6)',
                        color: isLoading ? 'rgba(0,255,159,0.5)' : '#00ff9f',
                        fontFamily: 'Orbitron, sans-serif',
                        letterSpacing: '0.25em',
                        clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 0 20px rgba(0,255,159,0.2)',
                      }}
                      onMouseEnter={(e) => { if (!isLoading) (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(0,255,159,0.5), 0 0 60px rgba(0,255,159,0.2)'; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,159,0.2)'; }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                          GENERATING KEY...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <KeyRound className="w-4 h-4" />
                          [ GENERATE ENCRYPTED KEY ]
                        </span>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="p-3 border rounded flex items-start gap-3"
                      style={{ background: 'rgba(255,180,0,0.05)', borderColor: 'rgba(255,180,0,0.4)' }}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#ffb400' }} />
                      <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,220,150,0.85)', fontFamily: 'JetBrains Mono, monospace' }}>
                        SAVE THIS KEY NOW. It will not be shown again. Without it the account is unrecoverable.
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'rgba(0,255,159,0.55)', fontFamily: 'JetBrains Mono, monospace' }}>
                        // PROFILE NAME
                      </div>
                      <div className="px-3 py-2 text-sm break-all"
                        style={{ background: 'rgba(0,255,159,0.05)', border: '1px solid rgba(0,255,159,0.25)', color: '#00ff9f', fontFamily: 'JetBrains Mono, monospace' }}>
                        {generatedKey.username}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'rgba(0,255,159,0.55)', fontFamily: 'JetBrains Mono, monospace' }}>
                        // ENCRYPTION KEY (= YOUR PASSWORD)
                      </div>
                      <div className="px-3 py-3 text-[11px] break-all max-h-44 overflow-y-auto"
                        style={{ background: 'rgba(0,255,159,0.05)', border: '1px solid rgba(0,255,159,0.25)', color: '#00ff9f', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
                        {generatedKey.encryptionKey}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => copyKey(generatedKey.encryptionKey)}
                        className="py-2.5 text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em', cursor: 'pointer' }}>
                        <Copy className="w-3.5 h-3.5" /> COPY
                      </button>
                      <button type="button" onClick={downloadKey}
                        className="py-2.5 text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em', cursor: 'pointer' }}>
                        <Download className="w-3.5 h-3.5" /> DOWNLOAD
                      </button>
                    </div>

                    <button type="button" onClick={useGeneratedKeyForLogin}
                      className="w-full py-3 mt-2 text-sm font-black tracking-widest uppercase relative overflow-hidden transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,255,159,0.18), rgba(0,200,120,0.18))',
                        border: '1px solid rgba(0,255,159,0.6)',
                        color: '#00ff9f',
                        fontFamily: 'Orbitron, sans-serif',
                        letterSpacing: '0.25em',
                        clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(0,255,159,0.2)',
                      }}>
                      [ I SAVED IT — LOGIN NOW ]
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Bottom scan line */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)' }} />
        </div>

        {/* Footer status */}
        <div className="mt-6 text-center flex items-center justify-center gap-4">
          <span className="text-xs" style={{ color: 'rgba(0,245,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
            v3.1.4 // ENCRYPTED
          </span>
          <span className="w-px h-3" style={{ background: 'rgba(0,245,255,0.2)' }} />
          <span className="text-xs" style={{ color: 'rgba(0,245,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
            GOV INTELLIGENCE
          </span>
        </div>
      </div>
    </div>
  );
}
