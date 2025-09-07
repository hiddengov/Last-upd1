import { Shield, BarChart3, List, Image, Settings, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="text-primary-foreground text-sm h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">IP Logger</h1>
            <p className="text-xs text-muted-foreground">Security Testing</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/"
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                location === "/" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="link-dashboard"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/logs"
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                location === "/logs" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="link-log-entries"
            >
              <List className="h-5 w-5" />
              <span>Log Entries</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/image-config"
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                location === "/image-config" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="link-image-config"
            >
              <Image className="h-5 w-5" />
              <span>Image Config</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                location === "/settings" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="link-settings"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="text-muted-foreground text-sm h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">Security Analyst</p>
            <p className="text-xs text-muted-foreground truncate">analyst@security.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
