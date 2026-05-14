import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/dashboard/sidebar";
import {
  Shield, Key, Users, Activity, Plus, Trash2, Eye, EyeOff,
  LogIn, Ban, CheckCircle, XCircle, Copy, Download, RefreshCw,
  Terminal, Database, Zap, Lock, Unlock, Crown, AlertTriangle,
  UserX, UserCheck, Settings, Edit2, ChevronDown, ChevronUp
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const singleKeySchema = z.object({
  key: z.string().min(1),
  usageLimit: z.coerce.number().min(1),
  expirationDays: z.coerce.number().optional(),
});
const bulkKeySchema = z.object({
  keyPrefix: z.string().min(1),
  keyCount: z.coerce.number().min(1).max(999999),
  usageLimit: z.coerce.number().min(1),
  expirationDays: z.coerce.number().optional(),
});

type Tab = "users" | "keys" | "system" | "extensions";

function CyberLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(0,245,255,0.4)", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.2em" }}>
      {children}
    </span>
  );
}

function CyberBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    admin:     { bg: "rgba(255,100,0,0.15)",  color: "#ff6400", label: "ADMIN" },
    developer: { bg: "rgba(160,80,255,0.15)", color: "#a050ff", label: "DEV" },
    tester:    { bg: "rgba(255,200,0,0.15)",  color: "#ffc800", label: "TESTER" },
    user:      { bg: "rgba(0,245,255,0.08)",  color: "#00f5ff", label: "USER" },
  };
  const cfg = map[type] || map.user;
  return (
    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: "Orbitron, sans-serif", border: `1px solid ${cfg.color}55` }}>
      {cfg.label}
    </span>
  );
}

function CyberButton({ children, onClick, variant = "primary", disabled, title, small }: any) {
  const styles: Record<string, any> = {
    primary:   { background: "rgba(0,245,255,0.1)",  border: "1px solid rgba(0,245,255,0.4)",  color: "#00f5ff" },
    danger:    { background: "rgba(255,50,50,0.08)",  border: "1px solid rgba(255,50,50,0.4)",  color: "#ff5050" },
    success:   { background: "rgba(0,255,159,0.08)",  border: "1px solid rgba(0,255,159,0.4)",  color: "#00ff9f" },
    warning:   { background: "rgba(255,200,0,0.08)",  border: "1px solid rgba(255,200,0,0.4)",  color: "#ffc800" },
    ghost:     { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center justify-center gap-1.5 ${small ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"} tracking-widest font-bold transition-all duration-150 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed`}
      style={{ ...s, fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </button>
  );
}

function CyberInput({ ...props }: any) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 text-xs outline-none transition-all"
      style={{
        background: "rgba(0,245,255,0.04)",
        border: "1px solid rgba(0,245,255,0.2)",
        color: "#e0f8ff",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "11px",
        ...(props.style || {}),
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0,245,255,0.1)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function UserCard({ u, currentUser, onImpersonate, onBan, onUnban, onDelete, onResetPassword }: any) {
  const [showPw, setShowPw] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [banReason, setBanReason] = useState("");
  const isDev = currentUser?.isDev;

  const statusColor = u.isBanned ? "#ff5050" : "#00ff9f";
  const statusLabel = u.isBanned ? "BANNED" : "ACTIVE";

  return (
    <div className="relative transition-all duration-200"
      style={{
        background: "rgba(0,6,12,0.7)",
        border: u.isDev ? "1px solid rgba(160,80,255,0.4)" : u.isBanned ? "1px solid rgba(255,50,50,0.3)" : "1px solid rgba(0,245,255,0.15)",
        boxShadow: u.isDev ? "0 0 20px rgba(160,80,255,0.08)" : "none",
      }}
    >
      {/* Scan line on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,245,255,0.02) 50%)", backgroundSize: "100% 4px" }}
      />

      {/* Top row */}
      <div className="flex items-center gap-3 p-3">
        {/* Avatar */}
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: u.isDev ? "rgba(160,80,255,0.12)" : "rgba(0,245,255,0.06)",
            border: `1px solid ${u.isDev ? "rgba(160,80,255,0.5)" : "rgba(0,245,255,0.25)"}`,
          }}
        >
          {u.profilePicture ? (
            <img src={u.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-black" style={{ fontFamily: "Orbitron, sans-serif", color: u.isDev ? "#a050ff" : "#00f5ff" }}>
              {u.username[0]?.toUpperCase()}
            </span>
          )}
          {u.isDev && <Crown className="absolute -top-1.5 -right-1.5 w-3 h-3" style={{ color: "#a050ff" }} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ color: u.isDev ? "#a050ff" : "rgba(200,240,255,0.95)", fontFamily: "Rajdhani, sans-serif" }}>
              {u.username}
            </span>
            <CyberBadge type={u.isDev ? "developer" : u.accountType} />
            <span className="text-[9px] px-1.5 py-0.5" style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em" }}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: "JetBrains Mono, monospace" }}>
              ID: {u.id.slice(0, 8)}…
            </span>
            {u.lastLoginAt && (
              <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: "JetBrains Mono, monospace" }}>
                LAST: {new Date(u.lastLoginAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isDev && !u.isDev && (
            <CyberButton small variant="success" onClick={() => onImpersonate(u)} title="Login as this user">
              <LogIn className="w-3 h-3" />
            </CyberButton>
          )}
          <CyberButton small variant="ghost" onClick={() => setExpanded(!expanded)} title="Expand details">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </CyberButton>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
          <div className="pt-3 space-y-3">
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              <div>
                <CyberLabel>Created</CyberLabel>
                <div style={{ color: "rgba(200,240,255,0.7)" }}>{new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <CyberLabel>Account Type</CyberLabel>
                <div style={{ color: "rgba(200,240,255,0.7)" }}>{u.accountType}</div>
              </div>
              {u.email && (
                <div className="col-span-2">
                  <CyberLabel>Email</CyberLabel>
                  <div style={{ color: "rgba(200,240,255,0.7)" }}>{u.email}</div>
                </div>
              )}
              {u.accessKeyUsed && (
                <div className="col-span-2">
                  <CyberLabel>Access Key Used</CyberLabel>
                  <div style={{ color: "rgba(200,240,255,0.7)" }}>{u.accessKeyUsed}</div>
                </div>
              )}
              {u.isBanned && (
                <div className="col-span-2">
                  <CyberLabel>Ban Reason</CyberLabel>
                  <div style={{ color: "#ff5050" }}>{u.banReason}</div>
                </div>
              )}
            </div>

            {/* Password visibility - dev only */}
            {isDev && (
              <div>
                <CyberLabel>Password (Admin View)</CyberLabel>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 px-2 py-1.5 text-[11px]"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,200,0,0.3)",
                      color: showPw ? "#ffc800" : "rgba(255,200,0,0.3)",
                      fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: showPw ? "0.05em" : "0.25em",
                    }}
                  >
                    {showPw ? (u.rawPassword || "(hashed — not stored in plain text)") : "•••••••••••••"}
                  </div>
                  <CyberButton small variant="warning" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </CyberButton>
                  {showPw && u.rawPassword && (
                    <CyberButton small variant="ghost" onClick={() => navigator.clipboard.writeText(u.rawPassword)}>
                      <Copy className="w-3 h-3" />
                    </CyberButton>
                  )}
                </div>
              </div>
            )}

            {/* Reset password */}
            {!u.isDev && (
              <div>
                <CyberLabel>Reset Password</CyberLabel>
                <div className="flex gap-2 mt-1">
                  <CyberInput
                    type="text"
                    placeholder="New password..."
                    value={newPw}
                    onChange={(e: any) => setNewPw(e.target.value)}
                  />
                  <CyberButton small variant="warning" onClick={() => { if (newPw) { onResetPassword(u.id, newPw); setNewPw(""); } }}>
                    <Lock className="w-3 h-3" />
                    RESET
                  </CyberButton>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!u.isDev && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {u.isBanned ? (
                  <CyberButton small variant="success" onClick={() => onUnban(u.id)}>
                    <UserCheck className="w-3 h-3" />
                    UNBAN
                  </CyberButton>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    <CyberInput
                      type="text"
                      placeholder="Ban reason..."
                      value={banReason}
                      onChange={(e: any) => setBanReason(e.target.value)}
                      style={{ width: "160px" }}
                    />
                    <CyberButton small variant="danger" onClick={() => { if (banReason) { onBan(u.id, banReason); setBanReason(""); } }}>
                      <UserX className="w-3 h-3" />
                      BAN
                    </CyberButton>
                  </div>
                )}
                <CyberButton small variant="danger" onClick={() => onDelete(u.id)}>
                  <Trash2 className="w-3 h-3" />
                  DELETE
                </CyberButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { user, token, login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState("");
  const qc = useQueryClient();

  const isAdmin = user?.isDev || user?.accountType === "admin" || user?.accountType === "developer";
  const isDev = user?.isDev;

  if (!isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
    refetchInterval: 15000,
  });

  const { data: allKeys = [], isLoading: keysLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/keys"],
    enabled: isAdmin,
  });

  const { data: systemStats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  const { data: extensionLogsData } = useQuery<any>({
    queryKey: ["/api/extension-logs"],
    enabled: isAdmin,
  });
  const extLogs = Array.isArray(extensionLogsData?.logs) ? extensionLogsData.logs : Array.isArray(extensionLogsData) ? extensionLogsData : [];

  const singleKeyForm = useForm({ resolver: zodResolver(singleKeySchema), defaultValues: { key: "", usageLimit: 100, expirationDays: undefined } });
  const bulkKeyForm = useForm({ resolver: zodResolver(bulkKeySchema), defaultValues: { keyPrefix: "", keyCount: 1, usageLimit: 100, expirationDays: undefined } });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/impersonate/${userId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      // Save original admin session so we can return
      sessionStorage.setItem("govImpersonatorToken", token || "");
      sessionStorage.setItem("govImpersonatorUser", JSON.stringify(user));
      sessionStorage.removeItem("govBootComplete");
      login(data.token, data.user);
      toast({ title: "IMPERSONATING", description: `Now logged in as ${data.user.username}` });
      setLocation("/");
    },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "USER BANNED" }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/unban`);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "USER UNBANNED" }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/dev/users/${userId}`);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "USER DELETED" }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const resetPwMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/password`, { newPassword });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "PASSWORD RESET" }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/create-key", data);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/keys"] }); singleKeyForm.reset(); toast({ title: "KEY CREATED" }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const bulkKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/create-bulk-keys", data);
      return res.json();
    },
    onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: ["/api/admin/keys"] }); setGeneratedKeys(data.keys); bulkKeyForm.reset(); toast({ title: `${data.keys.length} KEYS CREATED` }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/keys/${keyId}`);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/keys"] }); toast({ title: "KEY DELETED" }); },
    onError: (e: any) => toast({ title: "FAILED", description: e.message, variant: "destructive" }),
  });

  const filteredUsers = (allUsers as any[]).filter((u: any) =>
    u.username.toLowerCase().includes(userFilter.toLowerCase()) ||
    u.accountType?.toLowerCase().includes(userFilter.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: any; color: string; count?: number }[] = [
    { id: "users", label: "USERS", icon: Users, color: "#00f5ff", count: (allUsers as any[]).length },
    { id: "keys", label: "KEYS", icon: Key, color: "#00ff9f", count: (allKeys as any[]).length },
    { id: "system", label: "SYSTEM", icon: Activity, color: "#a050ff" },
    { id: "extensions", label: "EX LOGS", icon: Terminal, color: "#ffc800", count: extLogs.length },
  ];

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Background scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #00f5ff 0px, #00f5ff 1px, transparent 1px, transparent 4px)" }}
      />
      {/* Corner glow effects */}
      <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-20"
        style={{ background: "radial-gradient(circle at top right, rgba(160,80,255,0.3), transparent 70%)" }}
      />
      <div className="fixed bottom-0 left-64 w-96 h-64 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at bottom left, rgba(0,245,255,0.4), transparent 70%)" }}
      />

      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col relative z-10" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="flex-shrink-0 px-4 md:px-6 py-4 border-b relative"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(160,80,255,0.2)", backdropFilter: "blur(20px)" }}
        >
          {/* animated top border */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full animate-pulse"
              style={{ background: "linear-gradient(90deg, transparent, rgba(160,80,255,0.8) 30%, rgba(0,245,255,0.8) 60%, transparent)" }}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(160,80,255,0.3), rgba(0,245,255,0.3), transparent)" }}
          />

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield className="w-5 h-5" style={{ color: "#a050ff", filter: "drop-shadow(0 0 8px rgba(160,80,255,0.8))" }} />
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <Shield className="w-5 h-5" style={{ color: "#a050ff" }} />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-widest"
                    style={{ fontFamily: "Orbitron, sans-serif", color: "#a050ff", textShadow: "0 0 20px rgba(160,80,255,0.6)", letterSpacing: "0.25em" }}>
                    OWNER PANEL
                  </h1>
                  <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.5)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.18em" }}>
                    // RESTRICTED ACCESS — {user?.username?.toUpperCase()} — FULL PRIVILEGES
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live user count */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2"
                style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff9f", boxShadow: "0 0 6px #00ff9f" }} />
                <span className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.7)", fontFamily: "JetBrains Mono, monospace" }}>
                  {(allUsers as any[]).filter((u: any) => !u.isBanned).length} ACTIVE USERS
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab bar */}
        <div className="flex-shrink-0 flex border-b overflow-x-auto"
          style={{ background: "rgba(0,4,12,0.9)", borderColor: "rgba(0,245,255,0.1)" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 md:px-6 py-3 relative flex-shrink-0 transition-all duration-150"
                style={{
                  background: isActive ? `${tab.color}12` : "transparent",
                  borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                  color: isActive ? tab.color : "rgba(0,245,255,0.3)",
                  cursor: "pointer",
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ filter: isActive ? `drop-shadow(0 0 4px ${tab.color})` : "none" }} />
                <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", letterSpacing: "0.18em" }}>
                  {tab.label}
                </span>
                {tab.count !== undefined && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-none font-bold"
                    style={{ background: `${tab.color}18`, color: tab.color, fontFamily: "JetBrains Mono, monospace" }}>
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-px animate-pulse"
                    style={{ background: tab.color }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,245,255,0.15) transparent" }}>

          {/* === USERS TAB === */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-48">
                  <CyberInput
                    type="text"
                    placeholder="// filter by username or role..."
                    value={userFilter}
                    onChange={(e: any) => setUserFilter(e.target.value)}
                  />
                </div>
                <CyberButton variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["/api/admin/users"] })}>
                  <RefreshCw className="w-3 h-3" />
                  REFRESH
                </CyberButton>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff9f", boxShadow: "0 0 5px #00ff9f" }} />
                  <span className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.5)", fontFamily: "JetBrains Mono, monospace" }}>
                    {(allUsers as any[]).length} TOTAL
                  </span>
                </div>
              </div>

              {/* Impersonation banner note */}
              {isDev && (
                <div className="flex items-center gap-2 px-3 py-2"
                  style={{ background: "rgba(0,255,159,0.06)", border: "1px solid rgba(0,255,159,0.25)" }}>
                  <LogIn className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00ff9f" }} />
                  <span className="text-[10px] tracking-widest" style={{ color: "rgba(0,255,159,0.7)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>
                    As .GOVdev you can LOGIN AS any user — click <LogIn className="w-2.5 h-2.5 inline" /> on a user card. A session will be created and you'll be switched into their account. You can return via the admin panel link.
                  </span>
                </div>
              )}

              {usersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(0,245,255,0.15)", borderTopColor: "#00f5ff" }} />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16" style={{ color: "rgba(0,245,255,0.3)", fontFamily: "Orbitron, sans-serif", fontSize: "11px", letterSpacing: "0.2em" }}>
                  NO USERS FOUND
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((u: any) => (
                    <UserCard
                      key={u.id}
                      u={u}
                      currentUser={user}
                      onImpersonate={(u: any) => impersonateMutation.mutate(u.id)}
                      onBan={(id: string, reason: string) => banMutation.mutate({ userId: id, reason })}
                      onUnban={(id: string) => unbanMutation.mutate(id)}
                      onDelete={(id: string) => {
                        if (window.confirm(`DELETE user? This cannot be undone.`)) deleteMutation.mutate(id);
                      }}
                      onResetPassword={(id: string, pw: string) => resetPwMutation.mutate({ userId: id, newPassword: pw })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === KEYS TAB === */}
          {activeTab === "keys" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Create single key */}
                <div className="p-4 space-y-3" style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,255,159,0.2)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="w-4 h-4" style={{ color: "#00ff9f" }} />
                    <span className="text-[11px] font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", color: "#00ff9f", letterSpacing: "0.2em" }}>
                      CREATE KEY
                    </span>
                  </div>
                  <Form {...singleKeyForm}>
                    <form onSubmit={singleKeyForm.handleSubmit((d) => createKeyMutation.mutate(d))} className="space-y-3">
                      <div>
                        <CyberLabel>Key Value</CyberLabel>
                        <FormField control={singleKeyForm.control} name="key" render={({ field }) => (
                          <FormItem><FormControl><CyberInput placeholder="KEY-VALUE" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <CyberLabel>Usage Limit</CyberLabel>
                          <FormField control={singleKeyForm.control} name="usageLimit" render={({ field }) => (
                            <FormItem><FormControl><CyberInput type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div>
                          <CyberLabel>Expires (days)</CyberLabel>
                          <FormField control={singleKeyForm.control} name="expirationDays" render={({ field }) => (
                            <FormItem><FormControl><CyberInput type="number" placeholder="∞" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                      <CyberButton variant="success" disabled={createKeyMutation.isPending}>
                        <Plus className="w-3 h-3" />
                        {createKeyMutation.isPending ? "CREATING..." : "CREATE KEY"}
                      </CyberButton>
                    </form>
                  </Form>
                </div>

                {/* Create bulk keys */}
                <div className="p-4 space-y-3" style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,245,255,0.2)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-4 h-4" style={{ color: "#00f5ff" }} />
                    <span className="text-[11px] font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", color: "#00f5ff", letterSpacing: "0.2em" }}>
                      BULK GENERATE
                    </span>
                  </div>
                  <Form {...bulkKeyForm}>
                    <form onSubmit={bulkKeyForm.handleSubmit((d) => bulkKeyMutation.mutate(d))} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <CyberLabel>Prefix</CyberLabel>
                          <FormField control={bulkKeyForm.control} name="keyPrefix" render={({ field }) => (
                            <FormItem><FormControl><CyberInput placeholder="bulk-key" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div>
                          <CyberLabel>Count</CyberLabel>
                          <FormField control={bulkKeyForm.control} name="keyCount" render={({ field }) => (
                            <FormItem><FormControl><CyberInput type="number" min="1" max="999999" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div>
                          <CyberLabel>Usage Limit</CyberLabel>
                          <FormField control={bulkKeyForm.control} name="usageLimit" render={({ field }) => (
                            <FormItem><FormControl><CyberInput type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div>
                          <CyberLabel>Expires (days)</CyberLabel>
                          <FormField control={bulkKeyForm.control} name="expirationDays" render={({ field }) => (
                            <FormItem><FormControl><CyberInput type="number" placeholder="∞" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                      <CyberButton variant="primary" disabled={bulkKeyMutation.isPending}>
                        <Zap className="w-3 h-3" />
                        {bulkKeyMutation.isPending ? "GENERATING..." : "GENERATE BULK"}
                      </CyberButton>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Generated bulk keys */}
              {generatedKeys.length > 0 && (
                <div className="p-4" style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,255,159,0.25)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", color: "#00ff9f" }}>
                      GENERATED: {generatedKeys.length} KEYS
                    </span>
                    <CyberButton small variant="success" onClick={() => {
                      const blob = new Blob([generatedKeys.join("\n")], { type: "text/plain" });
                      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "keys.txt" });
                      a.click();
                    }}>
                      <Download className="w-3 h-3" />
                      EXPORT
                    </CyberButton>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,245,255,0.2) transparent" }}>
                    {generatedKeys.map((k, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1"
                        style={{ background: "rgba(0,255,159,0.04)", border: "1px solid rgba(0,255,159,0.1)" }}>
                        <span className="text-[11px]" style={{ color: "#00ff9f", fontFamily: "JetBrains Mono, monospace" }}>{k}</span>
                        <button onClick={() => navigator.clipboard.writeText(k)} style={{ color: "rgba(0,255,159,0.4)", cursor: "pointer", background: "none", border: "none" }}>
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key list */}
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-3">
                  <CyberLabel>ALL ACCESS KEYS ({(allKeys as any[]).length})</CyberLabel>
                  <CyberButton small variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["/api/admin/keys"] })}>
                    <RefreshCw className="w-3 h-3" />
                  </CyberButton>
                </div>
                {keysLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(0,255,159,0.15)", borderTopColor: "#00ff9f" }} />
                  </div>
                ) : (allKeys as any[]).length === 0 ? (
                  <div className="text-center py-8 text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: "Orbitron, sans-serif" }}>NO KEYS</div>
                ) : (
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,245,255,0.2) transparent" }}>
                    {(allKeys as any[]).map((k: any) => {
                      const expired = k.expiresAt && new Date(k.expiresAt) < new Date();
                      const depleted = k.usedCount >= k.usageLimit;
                      const status = !k.isActive ? "INACTIVE" : expired ? "EXPIRED" : depleted ? "DEPLETED" : "ACTIVE";
                      const statusColor = status === "ACTIVE" ? "#00ff9f" : "#ff5050";
                      return (
                        <div key={k.id} className="flex items-center gap-3 px-3 py-2"
                          style={{ background: "rgba(0,6,12,0.6)", border: "1px solid rgba(0,255,159,0.12)" }}>
                          <span className="flex-1 text-[11px] font-mono truncate" style={{ color: "#00ff9f", fontFamily: "JetBrains Mono, monospace" }}>{k.key}</span>
                          <span className="text-[9px] px-1.5" style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, fontFamily: "Orbitron, sans-serif" }}>{status}</span>
                          <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: "JetBrains Mono, monospace" }}>{k.usedCount}/{k.usageLimit}</span>
                          <button onClick={() => navigator.clipboard.writeText(k.key)} style={{ color: "rgba(0,245,255,0.4)", cursor: "pointer", background: "none", border: "none" }}>
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteKeyMutation.mutate(k.id)} style={{ color: "rgba(255,80,80,0.5)", cursor: "pointer", background: "none", border: "none" }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === SYSTEM TAB === */}
          {activeTab === "system" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "TOTAL USERS", value: systemStats?.totalUsers ?? "—", color: "#00f5ff", icon: Users },
                  { label: "TOTAL KEYS", value: systemStats?.totalKeys ?? "—", color: "#00ff9f", icon: Key },
                  { label: "ACTIVE KEYS", value: systemStats?.activeKeys ?? "—", color: "#00ff9f", icon: CheckCircle },
                  { label: "IP LOGS", value: systemStats?.totalLogs ?? "—", color: "#a050ff", icon: Database },
                  { label: "RECENT (24H)", value: systemStats?.recentActivity ?? "—", color: "#ffc800", icon: Activity },
                  { label: "EXTENSIONS", value: systemStats?.totalExtensions ?? "—", color: "#ff6400", icon: Terminal },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="p-4 relative overflow-hidden"
                      style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${stat.color}25` }}>
                      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                        style={{ background: `radial-gradient(circle at top right, ${stat.color}12, transparent 70%)` }}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                        <CyberLabel>{stat.label}</CyberLabel>
                      </div>
                      <div className="text-2xl font-black" style={{ color: stat.color, fontFamily: "Orbitron, sans-serif", textShadow: `0 0 12px ${stat.color}66` }}>
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 space-y-2" style={{ background: "rgba(0,6,12,0.7)", border: "1px solid rgba(0,245,255,0.15)" }}>
                <CyberLabel>SYSTEM STATUS</CyberLabel>
                {[
                  { label: "Storage Engine", value: "In-Memory + File Persistence", ok: true },
                  { label: "Session Auth", value: "JWT Bearer Token", ok: true },
                  { label: "Password Hashing", value: "bcrypt (10 rounds)", ok: true },
                  { label: "Admin Access", value: user?.username || "Unknown", ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: "rgba(0,245,255,0.07)" }}>
                    <span className="text-[11px]" style={{ color: "rgba(0,245,255,0.5)", fontFamily: "JetBrains Mono, monospace" }}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: "rgba(200,240,255,0.8)", fontFamily: "JetBrains Mono, monospace" }}>{item.value}</span>
                      {item.ok ? <CheckCircle className="w-3.5 h-3.5" style={{ color: "#00ff9f" }} /> : <XCircle className="w-3.5 h-3.5" style={{ color: "#ff5050" }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === EXTENSION LOGS TAB === */}
          {activeTab === "extensions" && (
            <div className="space-y-2">
              <CyberLabel>EXTENSION ACTIVITY LOG ({extLogs.length})</CyberLabel>
              {extLogs.length === 0 ? (
                <div className="text-center py-16 text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.3)", fontFamily: "Orbitron, sans-serif" }}>NO EXTENSION ACTIVITY</div>
              ) : (
                <div className="space-y-1 mt-3">
                  {extLogs.slice(0, 100).map((log: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2"
                      style={{ background: "rgba(0,6,12,0.6)", border: "1px solid rgba(255,200,0,0.1)" }}>
                      <span className="text-[9px] flex-shrink-0 mt-0.5" style={{ color: "rgba(255,200,0,0.5)", fontFamily: "JetBrains Mono, monospace" }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}
                      </span>
                      <span className="text-[10px] flex-1" style={{ color: "rgba(200,240,255,0.7)", fontFamily: "JetBrains Mono, monospace" }}>
                        {log.action || log.event || JSON.stringify(log).slice(0, 80)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
