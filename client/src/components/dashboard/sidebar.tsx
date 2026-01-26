import { Shield, BarChart3, List, Image, Settings, User, LogOut, Palette, Youtube, Puzzle, Activity, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Log Entries", href: "/logs", icon: List },
    { name: "Image Config", href: "/image-config", icon: Image },
    { name: "YouTube Proxy", href: "/youtube-proxy", icon: Youtube },
    { name: "Extension Generator", href: "/extension-generator", icon: Puzzle },
    { name: "EX LOGS", href: "/extension-logs", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const adminNavigation = [
    { name: "ADMIN PANEL", href: "/admin-panel", icon: ShieldCheck },
  ];

  const isAdmin = user?.isDev || user?.accountType === 'admin' || user?.accountType === 'developer';

  return (
    <aside className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 flex flex-col relative z-20">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600/80 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Shield className="text-white text-sm h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white drop-shadow-lg">.GOV | DASHBOARD #1</h1>
            <a
              href="https://discord.gg/TrgmgtByzt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-300 hover:text-white underline transition-colors"
            >
              Discord Server
            </a>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  location === item.href
                    ? "bg-blue-600/80 text-white backdrop-blur-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <li className="pt-2">
                <div className="border-t border-white/10 pt-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wide px-3 pb-2 font-semibold">
                    Admin Access
                  </div>
                </div>
              </li>
              {adminNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      location === item.href
                        ? "bg-red-600/80 text-white backdrop-blur-sm shadow-lg"
                        : "text-red-300 hover:text-white hover:bg-red-600/20 border border-red-600/30"
                    }`}
                    data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Current Theme */}
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-purple-600/80 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Palette className="text-white text-sm h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{currentTheme.name}</p>
            <p className="text-xs text-gray-400 truncate">Current Theme</p>
          </div>
        </div>

        {/* User Info */}
        <Link
          href="/profile"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors hover:bg-white/10 ${
            location === '/profile'
              ? "bg-blue-600/80 text-white backdrop-blur-sm"
              : "text-white hover:text-white"
          }`}
          data-testid="link-profile"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={undefined} alt="Profile" />
            <AvatarFallback className="text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || 'User'}</p>
            <p className="text-xs opacity-75 truncate">
              {user?.isDev ? 'Developer' : 'User'}
            </p>
          </div>
        </Link>

        {/* Logout Button */}
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full justify-start animate-slide-in-left hover:animate-pulse-subtle transition-all duration-300 hover:bg-white/10 text-white border-white/20"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}