import { Shield, BarChart3, List, Image, Settings, User, LogOut, Palette } from "lucide-react";
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
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="text-primary-foreground text-sm h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Exnl IP LOGGER</h1>
            <p className="text-xs text-muted-foreground">Security Testing</p>
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
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {/* Current Theme */}
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Palette className="text-primary-foreground text-sm h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{currentTheme.name}</p>
            <p className="text-xs text-muted-foreground truncate">Current Theme</p>
          </div>
        </div>

        {/* User Info */}
        <Link 
          href="/profile"
          className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors hover:bg-accent ${
            location === '/profile' 
              ? "bg-primary text-primary-foreground" 
              : "text-foreground hover:text-foreground"
          }`}
          data-testid="link-profile"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profilePicture || undefined} alt="Profile" />
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
          className="w-full justify-start"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}