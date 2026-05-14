import { BarChart3, List, Image, Settings, User, LogOut, Youtube, Puzzle, Activity, ShieldCheck, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

function GovLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        <div className="absolute inset-0 rounded border border-cyan-400/40 animate-spin-slow" />
        <div className="w-8 h-8 flex items-center justify-center rounded"
          style={{
            background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(59,130,246,0.12))',
            border: '1px solid rgba(0,245,255,0.5)',
            boxShadow: '0 0 15px rgba(0,245,255,0.25), inset 0 0 8px rgba(0,245,255,0.05)'
          }}
        >
          <span className="text-xs font-black" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 10px #00f5ff', letterSpacing: '0.05em' }}>
            GOV
          </span>
        </div>
      </div>
      <div>
        <h1 className="text-sm font-black tracking-widest leading-none" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
          .GOV
        </h1>
        <a href="https://discord.gg/TrgmgtByzt" target="_blank" rel="noopener noreferrer"
          className="text-xs hover:text-cyan-300 transition-colors flex items-center gap-1 mt-0.5"
          style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
          <Zap className="w-2.5 h-2.5" />
          discord
        </a>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3, color: '#00f5ff' },
    { name: "Log Entries", href: "/logs", icon: List, color: '#00ff9f' },
    { name: "Image Config", href: "/image-config", icon: Image, color: '#a78bfa' },
    { name: "YouTube Proxy", href: "/youtube-proxy", icon: Youtube, color: '#f87171' },
    { name: "Extension Gen", href: "/extension-generator", icon: Puzzle, color: '#fbbf24' },
    { name: "EX Logs", href: "/extension-logs", icon: Activity, color: '#34d399' },
    { name: "Settings", href: "/settings", icon: Settings, color: '#94a3b8' },
  ];

  const adminNavigation = [
    { name: "ADMIN PANEL", href: "/admin-panel", icon: ShieldCheck, color: '#ff4444' },
  ];

  const isAdmin = user?.isDev || user?.accountType === 'admin' || user?.accountType === 'developer';

  return (
    <aside className="hidden md:flex w-64 flex-col relative z-20 flex-shrink-0"
      style={{
        background: 'rgba(0, 4, 12, 0.95)',
        borderRight: '1px solid rgba(0,245,255,0.12)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Glowing right border line */}
      <div className="absolute right-0 top-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(0,245,255,0.4) 30%, rgba(0,245,255,0.4) 70%, transparent)' }}
      />

      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        <GovLogo />

        {/* Live clock */}
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>SYS TIME</span>
            <span className="text-xs" style={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
          <div className="mt-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,245,255,0.1), rgba(0,245,255,0.3), rgba(0,245,255,0.1))' }} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Section label */}
        <div className="px-2 mb-3">
          <span className="text-xs tracking-widest" style={{ color: 'rgba(0,245,255,0.25)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
            // NAVIGATION
          </span>
        </div>

        <ul className="space-y-1">
          {navigation.map((item, idx) => {
            const isActive = location === item.href;
            return (
              <li key={item.name} style={{ '--stagger': idx } as any} className="animate-slide-in-left animate-stagger">
                <Link href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-none relative group overflow-hidden transition-all duration-200"
                  style={{
                    background: isActive ? `rgba(${item.color === '#00f5ff' ? '0,245,255' : item.color === '#00ff9f' ? '0,255,159' : '255,255,255'}, 0.07)` : 'transparent',
                    borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                    boxShadow: isActive ? `inset 0 0 20px rgba(0,245,255,0.03)` : 'none',
                  }}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, rgba(0,245,255,0.03), transparent)' }}
                  />

                  <item.icon className="h-4 w-4 flex-shrink-0 transition-all duration-200 relative z-10"
                    style={{ color: isActive ? item.color : 'rgba(0,245,255,0.3)', filter: isActive ? `drop-shadow(0 0 4px ${item.color})` : 'none' }}
                  />
                  <span className="text-sm font-medium relative z-10 transition-colors duration-200"
                    style={{
                      color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(180,220,240,0.5)',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {item.name}
                  </span>

                  {isActive && (
                    <div className="ml-auto w-1 h-1 rounded-full animate-pulse"
                      style={{ background: item.color, boxShadow: `0 0 6px ${item.color}`, flexShrink: 0 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <li className="pt-4 pb-1 px-2">
                <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, rgba(255,50,50,0.2), rgba(255,50,50,0.05))' }} />
                <span className="text-xs tracking-widest" style={{ color: 'rgba(255,80,80,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
                  // RESTRICTED
                </span>
              </li>
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 relative group overflow-hidden transition-all duration-200"
                      style={{
                        background: isActive ? 'rgba(255,50,50,0.12)' : 'rgba(255,50,50,0.04)',
                        borderLeft: isActive ? '2px solid #ff4444' : '2px solid rgba(255,50,50,0.3)',
                        border: `1px solid rgba(255,50,50,${isActive ? '0.4' : '0.15'})`,
                      }}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: '#ff4444', filter: 'drop-shadow(0 0 4px rgba(255,50,50,0.6))' }} />
                      <span className="text-sm font-bold tracking-wide" style={{ color: '#ff6666', fontFamily: 'Orbitron, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        {/* User info */}
        <Link href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-none mb-2 transition-all duration-200 group"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.15)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,245,255,0.04)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div className="relative flex-shrink-0">
            <Avatar className="w-8 h-8" style={{ border: '1px solid rgba(0,245,255,0.3)' }}>
              <AvatarFallback className="text-sm font-bold"
                style={{ background: 'rgba(0,245,255,0.1)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: '11px' }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #00ff9f' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(200,240,255,0.9)', fontFamily: 'Rajdhani, sans-serif' }}>
              {user?.username || 'Operator'}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
              {user?.isDev ? '// DEVELOPER' : `// ${(user?.accountType || 'user').toUpperCase()}`}
            </p>
          </div>
        </Link>

        {/* Logout */}
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs tracking-widest uppercase transition-all duration-200"
          style={{
            background: 'rgba(255,50,50,0.04)',
            border: '1px solid rgba(255,50,50,0.15)',
            color: 'rgba(255,100,100,0.6)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.15em',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(255,50,50,0.1)';
            el.style.borderColor = 'rgba(255,50,50,0.4)';
            el.style.color = 'rgba(255,80,80,0.9)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(255,50,50,0.04)';
            el.style.borderColor = 'rgba(255,50,50,0.15)';
            el.style.color = 'rgba(255,100,100,0.6)';
          }}
        >
          <LogOut className="h-3 w-3" />
          DISCONNECT
        </button>
      </div>
    </aside>
  );
}
