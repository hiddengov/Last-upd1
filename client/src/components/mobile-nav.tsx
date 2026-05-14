import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, List, Image, Settings, User, Youtube, Puzzle, Activity, ShieldCheck, LogOut } from "lucide-react";
import { useState } from "react";

export default function MobileNav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const isAdmin = user?.isDev || user?.accountType === "admin" || user?.accountType === "developer";

  const primary = [
    { href: "/",                  icon: BarChart3,   label: "DASH",    color: "#00f5ff" },
    { href: "/logs",              icon: List,        label: "LOGS",    color: "#00ff9f" },
    { href: "/image-config",      icon: Image,       label: "CONFIG",  color: "#a78bfa" },
    { href: "/youtube-proxy",     icon: Youtube,     label: "YOUTUBE", color: "#f87171" },
    { href: "/settings",          icon: Settings,    label: "SETTINGS",color: "#94a3b8" },
  ];

  const secondary = [
    { href: "/extension-generator", icon: Puzzle,   label: "EXT GEN", color: "#fbbf24" },
    { href: "/extension-logs",      icon: Activity, label: "EX LOGS", color: "#34d399" },
    { href: "/profile",             icon: User,     label: "PROFILE", color: "#00f5ff" },
    ...(isAdmin ? [{ href: "/admin-panel", icon: ShieldCheck, label: "ADMIN", color: "#ff4444" }] : []),
  ];

  return (
    <>
      {/* More panel slide-up */}
      {showMore && (
        <div className="fixed inset-0 z-[9990] md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
          <div className="absolute bottom-16 left-0 right-0 mx-2 p-3"
            style={{ background: "rgba(0,6,12,0.98)", border: "1px solid rgba(0,245,255,0.25)", boxShadow: "0 -20px 40px rgba(0,245,255,0.08)" }}>
            <div className="grid grid-cols-4 gap-2">
              {secondary.map((item) => {
                const Icon = item.icon;
                const active = location === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-1.5 py-3 transition-all"
                    style={{
                      background: active ? `${item.color}18` : "rgba(0,245,255,0.03)",
                      border: `1px solid ${active ? item.color + "55" : "rgba(0,245,255,0.1)"}`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: active ? item.color : "rgba(0,245,255,0.4)", filter: active ? `drop-shadow(0 0 4px ${item.color})` : "none" }} />
                    <span className="text-[8px] tracking-widest" style={{ color: active ? item.color : "rgba(0,245,255,0.4)", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em" }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              {/* Logout */}
              <button onClick={logout}
                className="flex flex-col items-center gap-1.5 py-3 transition-all"
                style={{ background: "rgba(255,50,50,0.05)", border: "1px solid rgba(255,50,50,0.15)", cursor: "pointer" }}
              >
                <LogOut className="w-4 h-4" style={{ color: "rgba(255,80,80,0.6)" }} />
                <span className="text-[8px] tracking-widest" style={{ color: "rgba(255,80,80,0.6)", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em" }}>
                  EXIT
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[9991] md:hidden border-t"
        style={{
          background: "rgba(0,4,12,0.97)",
          borderColor: "rgba(0,245,255,0.2)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -4px 30px rgba(0,245,255,0.08)",
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.4) 30%, rgba(0,255,159,0.4) 70%, transparent)" }}
        />

        <div className="flex items-stretch h-16">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
                style={{ background: active ? `${item.color}10` : "transparent" }}
              >
                {active && (
                  <div className="absolute top-0 left-2 right-2 h-px" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                )}
                <Icon className="w-4 h-4 transition-all"
                  style={{ color: active ? item.color : "rgba(0,245,255,0.25)", filter: active ? `drop-shadow(0 0 5px ${item.color})` : "none" }}
                />
                <span className="text-[8px] tracking-widest transition-all"
                  style={{ color: active ? item.color : "rgba(0,245,255,0.3)", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button onClick={() => setShowMore(!showMore)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
            style={{ background: showMore ? "rgba(0,245,255,0.08)" : "transparent", cursor: "pointer", border: "none" }}
          >
            {showMore && (
              <div className="absolute top-0 left-2 right-2 h-px" style={{ background: "#00f5ff", boxShadow: "0 0 8px #00f5ff" }} />
            )}
            <div className="flex flex-col gap-0.5 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{
                    width: showMore ? "14px" : i === 1 ? "8px" : "14px",
                    height: "2px",
                    background: showMore ? "#00f5ff" : "rgba(0,245,255,0.25)",
                    boxShadow: showMore ? "0 0 5px #00f5ff" : "none",
                  }}
                />
              ))}
            </div>
            <span className="text-[8px] tracking-widest"
              style={{ color: showMore ? "#00f5ff" : "rgba(0,245,255,0.3)", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em" }}>
              MORE
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
