import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LogOut, Shield } from "lucide-react";
import KeyAccess from "@/pages/key-access";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import BootScreen from "@/components/boot-screen";
import MobileNav from "@/components/mobile-nav";
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

  const impersonatorUser = (() => {
    try { return JSON.parse(sessionStorage.getItem("govImpersonatorUser") || "null"); } catch { return null; }
  })();
  const isImpersonating = !!impersonatorUser;

  // Show main app once authenticated and booted
  return (
    <>
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2"
          style={{ background: "rgba(255,100,0,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,150,0,0.6)", boxShadow: "0 2px 20px rgba(255,100,0,0.4)" }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em" }}>
              IMPERSONATING: {user?.username?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => {
              const origToken = sessionStorage.getItem("govImpersonatorToken");
              const origUser = JSON.parse(sessionStorage.getItem("govImpersonatorUser") || "null");
              if (origToken && origUser) {
                sessionStorage.removeItem("govImpersonatorToken");
                sessionStorage.removeItem("govImpersonatorUser");
                login(origToken, origUser);
                window.location.href = "/admin-panel";
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-widest text-white hover:bg-white hover:bg-opacity-20 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.5)", fontFamily: "Orbitron, sans-serif", cursor: "pointer", background: "none", letterSpacing: "0.15em" }}
          >
            <LogOut className="w-3 h-3" />
            RETURN TO ADMIN
          </button>
        </div>
      )}
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
      <MobileNav />
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