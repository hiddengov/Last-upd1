import { useState } from "react";
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

  const handleAccessGranted = () => {
    setHasAccessKey(true);
    localStorage.setItem('hasAccessKey', 'true');
  };

  const handleLogin = (token: string, user: any) => {
    login(token, user);
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

  // Show main app once authenticated
  return (
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