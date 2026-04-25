import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import KeyAccess from "@/pages/key-access";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import BootScreen from "@/components/boot-screen";
import WebSearchEmbed from "@/components/web-search-embed";
import { Search as SearchIcon } from "lucide-react";
import LogEntries from "@/pages/log-entries";
import ImageConfig from "@/pages/image-config";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import YoutubeProxy from "@/pages/youtube-proxy";
import ExtensionGenerator from "@/pages/extension-generator";
import ExtensionLogs from "@/pages/extension-logs";
import AdminPanel from "@/pages/admin-panel";
import NotFound from "@/pages/not-found";


function Router() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [hasAccessKey, setHasAccessKey] = useState(() => {
    return localStorage.getItem('hasAccessKey') === 'true';
  });
  const [bootDone, setBootDone] = useState(() => {
    return sessionStorage.getItem('govBootComplete') === 'true';
  });

  const handleAccessGranted = () => {
    setHasAccessKey(true);
    localStorage.setItem('hasAccessKey', 'true');
  };

  const handleLogin = (token: string, user: any) => {
    sessionStorage.removeItem('govBootComplete');
    setBootDone(false);
    login(token, user);
  };

  const handleBootComplete = () => {
    sessionStorage.setItem('govBootComplete', 'true');
    setBootDone(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show key access page first
  if (!hasAccessKey) {
    return <KeyAccess onAccessGranted={handleAccessGranted} />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  // Show eDEX-style boot screen once per session after authentication
  if (!bootDone) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  // Show main app once authenticated and booted
  return (
    <>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/logs" component={LogEntries} />
        <Route path="/image-config" component={ImageConfig} />
        <Route path="/youtube-proxy" component={YoutubeProxy} />
        <Route path="/extension-generator" component={ExtensionGenerator} />
        <Route path="/extension-logs" component={ExtensionLogs} />
        <Route path="/admin-panel" component={AdminPanel} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
      <SearchLauncher />
    </>
  );
}

function SearchLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Open with Ctrl+K (or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Web Search Embed (Ctrl+K)"
        className="fixed bottom-5 right-5 z-[9998] w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, rgba(0,8,12,0.95), rgba(0,5,10,0.95))",
          border: "1px solid rgba(0,245,255,0.5)",
          boxShadow: "0 0 18px rgba(0,245,255,0.35), inset 0 0 10px rgba(0,245,255,0.08)",
          cursor: "pointer",
          clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(0,245,255,0.6), inset 0 0 14px rgba(0,245,255,0.15)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(0,245,255,0.35), inset 0 0 10px rgba(0,245,255,0.08)"; }}
      >
        <SearchIcon className="w-5 h-5" style={{ color: "#00f5ff" }} />
      </button>
      <WebSearchEmbed open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {({ user, isAuthenticated }) => (
          <ThemeProvider user={user} isAuthenticated={isAuthenticated}>
            <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
          </ThemeProvider>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;