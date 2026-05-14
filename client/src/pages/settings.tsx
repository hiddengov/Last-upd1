import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Key, Shield, UserPlus, Ban, Trash2, UserCheck, Eye, ArrowLeft, Palette, Snowflake, Save, Loader2, Webhook, Bot, Cpu } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import * as z from "zod";
import Sidebar from "@/components/dashboard/sidebar";

const CY = {
  font: "Orbitron, sans-serif",
  mono: "JetBrains Mono, monospace",
  cyan: "#00f5ff",
  green: "#00ff9f",
  red: "#ff5050",
  yellow: "#ffc800",
  purple: "#a050ff",
  orange: "#ff6400",
};

// ── Schemas ──────────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  username: z.string().min(3, "Min 3 characters"),
  password: z.string().min(6, "Min 6 characters"),
  accountType: z.enum(["user", "tester", "developer"]),
  isDev: z.boolean().default(false),
});

const keyFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  usageLimit: z.string().min(1, "Usage limit is required"),
  expirationDays: z.string().optional(),
});

const editRoleSchema = z.object({
  accountType: z.enum(["user", "tester", "developer", "admin"]),
  isDev: z.boolean(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Min 6 characters"),
});

const webhookSchema = z.object({
  webhookUrl: z.string().url("Enter a valid Discord webhook URL").optional().or(z.literal("")),
});

const botConfigSchema = z.object({
  discordBotToken:  z.string().optional().or(z.literal("")),
  discordServerId:  z.string().optional().or(z.literal("")),
  discordChannelId: z.string().optional().or(z.literal("")),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function CyberLabel({ children }: any) {
  return (
    <span className="block mb-1.5 text-[9px] tracking-widest uppercase"
      style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.2em" }}>
      {children}
    </span>
  );
}

function CyberInput({ value, onChange, placeholder, type = "text", ...rest }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest}
      className="w-full px-3 py-2.5 text-xs outline-none transition-all"
      style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.mono, fontSize: "12px" }}
      onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 8px rgba(0,245,255,0.08)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function CyberBtn({ children, onClick, type = "button", disabled, variant = "primary", small }: any) {
  const v: Record<string, any> = {
    primary:  { bg: "rgba(0,245,255,0.08)",  border: "rgba(0,245,255,0.35)",  color: "#00f5ff" },
    success:  { bg: "rgba(0,255,159,0.08)",  border: "rgba(0,255,159,0.35)",  color: "#00ff9f" },
    warning:  { bg: "rgba(255,200,0,0.06)",  border: "rgba(255,200,0,0.35)",  color: "#ffc800" },
    danger:   { bg: "rgba(255,80,80,0.06)",  border: "rgba(255,80,80,0.35)",  color: "#ff5050" },
    purple:   { bg: "rgba(160,80,255,0.08)", border: "rgba(160,80,255,0.35)", color: "#a050ff" },
  };
  const s = v[variant] || v.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 ${small ? "px-2.5 py-1 text-[9px]" : "px-4 py-2.5 text-[10px]"} font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function Panel({ title, icon: Icon, color = CY.cyan, children }: any) {
  return (
    <div style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${color}25` }}>
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: `${color}18`, background: "rgba(0,8,20,0.6)" }}>
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        <span className="text-[11px] font-bold tracking-widest" style={{ fontFamily: CY.font, color, letterSpacing: "0.2em" }}>{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, token } = useAuth();
  const { currentTheme, themes, setTheme, snowColor, setSnowColor } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Dev state
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [devKeys, setDevKeys] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<any>(null);

  const [currentWebhookUrl, setCurrentWebhookUrl] = useState("");

  const webhookForm = useForm({ resolver: zodResolver(webhookSchema), defaultValues: { webhookUrl: "" } });
  const botConfigForm = useForm<z.infer<typeof botConfigSchema>>({ resolver: zodResolver(botConfigSchema), defaultValues: { discordBotToken: "", discordServerId: "", discordChannelId: "" } });
  const createUserForm = useForm<z.infer<typeof createUserSchema>>({ resolver: zodResolver(createUserSchema), defaultValues: { username: "", password: "", accountType: "user", isDev: false } });
  const keyForm = useForm<z.infer<typeof keyFormSchema>>({ resolver: zodResolver(keyFormSchema), defaultValues: { key: "", usageLimit: "", expirationDays: "" } });
  const editRoleForm = useForm<z.infer<typeof editRoleSchema>>({ resolver: zodResolver(editRoleSchema), defaultValues: { accountType: "user", isDev: false } });
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { newPassword: "" } });

  useEffect(() => {
    loadWebhookSettings();
    loadBotConfig();
    if (user?.isDev) { loadDevUsers(); loadDevKeys(); }
  }, [user]);

  const api = async (path: string, opts?: RequestInit) => {
    const res = await fetch(path, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers || {}) }, ...opts });
    return res;
  };

  const loadWebhookSettings = async () => {
    try {
      const res = await api("/api/settings");
      if (res.ok) { const d = await res.json(); setCurrentWebhookUrl(d.webhookUrl || ""); webhookForm.setValue("webhookUrl", d.webhookUrl || ""); }
    } catch { /* silent */ }
  };

  const loadBotConfig = async () => {
    try {
      const res = await api("/api/settings");
      if (res.ok) {
        const d = await res.json();
        botConfigForm.setValue("discordBotToken", d.discordBotToken || "");
        botConfigForm.setValue("discordServerId", d.discordServerId || "");
        botConfigForm.setValue("discordChannelId", d.discordChannelId || "");
      }
    } catch { /* silent */ }
  };

  const handleSaveWebhook = async (data: z.infer<typeof webhookSchema>) => {
    setIsLoading(true);
    try {
      const res = await api("/api/settings", { method: "POST", body: JSON.stringify({ webhookUrl: data.webhookUrl || null }) });
      if (!res.ok) throw new Error("Failed");
      setCurrentWebhookUrl(data.webhookUrl || "");
      toast({ title: "WEBHOOK SAVED" });
    } catch { toast({ title: "SAVE FAILED", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleSaveBotConfig = async (data: z.infer<typeof botConfigSchema>) => {
    setIsLoading(true);
    try {
      const res = await api("/api/settings", { method: "POST", body: JSON.stringify({ discordBotToken: data.discordBotToken || null, discordServerId: data.discordServerId || null, discordChannelId: data.discordChannelId || null }) });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "BOT CONFIG SAVED" });
    } catch { toast({ title: "SAVE FAILED", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const loadDevUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api("/api/dev/users");
      if (res.ok) setDevUsers(await res.json());
    } catch { /* silent */ }
    finally { setIsLoadingUsers(false); }
  };

  const loadDevKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await api("/api/dev/keys");
      if (res.ok) setDevKeys(await res.json());
    } catch { /* silent */ }
    finally { setIsLoadingKeys(false); }
  };

  const handleCreateUser = async (data: z.infer<typeof createUserSchema>) => {
    setIsLoading(true);
    try {
      const res = await api("/api/dev/users", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: "USER CREATED" }); createUserForm.reset(); loadDevUsers();
    } catch (e: any) { toast({ title: "CREATE FAILED", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleCreateKey = async (data: z.infer<typeof keyFormSchema>) => {
    try {
      const payload: any = { key: data.key, usageLimit: parseInt(data.usageLimit) };
      if (data.expirationDays?.trim()) payload.expirationDays = parseInt(data.expirationDays);
      else if (!user?.isDev) payload.expirationDays = 30;
      const res = await api("/api/dev/keys", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: "KEY CREATED" }); keyForm.reset(); loadDevKeys();
    } catch (e: any) { toast({ title: "CREATE FAILED", description: e.message, variant: "destructive" }); }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      const res = await api(`/api/dev/users/${userId}/ban`, { method: "POST", body: JSON.stringify({ reason }) });
      if (!res.ok) throw new Error();
      toast({ title: "USER BANNED" }); loadDevUsers();
    } catch { toast({ title: "BAN FAILED", variant: "destructive" }); }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await api(`/api/dev/users/${userId}/unban`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: "USER UNBANNED" }); loadDevUsers();
    } catch { toast({ title: "UNBAN FAILED", variant: "destructive" }); }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await api(`/api/dev/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "USER DELETED" }); loadDevUsers();
    } catch { toast({ title: "DELETE FAILED", variant: "destructive" }); }
  };

  const handleEditRole = async (data: z.infer<typeof editRoleSchema>) => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      const res = await api(`/api/dev/users/${editingUser.id}/role`, { method: "PUT", body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      toast({ title: "ROLE UPDATED" }); setEditingUser(null); editRoleForm.reset(); loadDevUsers();
    } catch { toast({ title: "UPDATE FAILED", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    if (!resettingPasswordUser) return;
    setIsLoading(true);
    try {
      const res = await api(`/api/admin/users/${resettingPasswordUser.id}/password`, { method: "PUT", body: JSON.stringify({ newPassword: data.newPassword }) });
      if (!res.ok) throw new Error();
      toast({ title: "PASSWORD RESET" }); setResettingPasswordUser(null); resetPasswordForm.reset();
    } catch { toast({ title: "RESET FAILED", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const res = await api(`/api/dev/keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "KEY DELETED" }); loadDevKeys();
    } catch { toast({ title: "DELETE FAILED", variant: "destructive" }); }
  };

  const TABS = [
    { id: "general",  label: "GENERAL",  icon: User },
    { id: "theme",    label: "THEME",    icon: Palette },
    { id: "effects",  label: "EFFECTS",  icon: Snowflake },
    { id: "webhook",  label: "WEBHOOK",  icon: Webhook },
    { id: "bot",      label: "BOT",      icon: Bot },
    ...(user?.isDev ? [
      { id: "dev-users", label: "USERS", icon: UserPlus },
      { id: "dev-keys",  label: "KEYS",  icon: Key },
    ] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed top-0 right-0 w-64 h-64 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at top right, rgba(160,80,255,0.3), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(0,245,255,0.12)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.5) 30%, rgba(160,80,255,0.5) 70%, transparent)" }} />
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4" style={{ color: CY.cyan, filter: "drop-shadow(0 0 6px rgba(0,245,255,0.8))" }} />
            <div>
              <h1 className="text-base md:text-lg font-black tracking-widest"
                style={{ fontFamily: CY.font, color: CY.cyan, textShadow: "0 0 15px rgba(0,245,255,0.5)", letterSpacing: "0.2em" }}>
                SETTINGS
              </h1>
              <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                // SYSTEM CONFIGURATION — GOV V8 PLATFORM
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Tab bar */}
          <div className="flex gap-1 mb-5 overflow-x-auto pb-1" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-[9px] font-bold tracking-widest transition-all flex-shrink-0"
                  style={{
                    background: isActive ? "rgba(0,245,255,0.1)" : "transparent",
                    border: "none",
                    borderBottom: `2px solid ${isActive ? CY.cyan : "transparent"}`,
                    color: isActive ? CY.cyan : "rgba(0,245,255,0.3)",
                    fontFamily: CY.font,
                    letterSpacing: "0.15em",
                    cursor: "pointer",
                    marginBottom: "-1px",
                  }}>
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-4 max-w-2xl">

            {/* ── GENERAL ── */}
            {activeTab === "general" && (
              <Panel title="ACCOUNT INFORMATION" icon={User} color={CY.cyan}>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center"
                      style={{ background: "rgba(0,245,255,0.1)", border: "2px solid rgba(0,245,255,0.3)" }}>
                      <span className="text-2xl font-black" style={{ fontFamily: CY.font, color: CY.cyan }}>
                        {user?.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "rgba(200,240,255,0.9)", fontFamily: "Rajdhani, sans-serif" }}>
                        {user?.username}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] px-2 py-0.5 font-bold tracking-widest"
                          style={{ background: user?.isDev ? "rgba(160,80,255,0.12)" : "rgba(0,245,255,0.08)", border: `1px solid ${user?.isDev ? "rgba(160,80,255,0.4)" : "rgba(0,245,255,0.3)"}`, color: user?.isDev ? CY.purple : CY.cyan, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                          {user?.isDev ? "DEV" : user?.accountType?.toUpperCase() || "USER"}
                        </span>
                        {user?.isDev && <Shield className="w-3.5 h-3.5" style={{ color: CY.purple }} />}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 text-[10px]" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.1)", color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                    // To update your profile or change your password, go to the PROFILE section
                  </div>
                </div>
              </Panel>
            )}

            {/* ── THEME ── */}
            {activeTab === "theme" && (
              <Panel title="VISUAL THEME" icon={Palette} color={CY.purple}>
                <div className="space-y-4">
                  <div>
                    <CyberLabel>ACTIVE THEME</CyberLabel>
                    <Select value={currentTheme.id} onValueChange={setTheme}>
                      <SelectTrigger className="w-full h-10"
                        style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.font, fontSize: "10px", letterSpacing: "0.1em" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: "#000d1a", border: "1px solid rgba(0,245,255,0.2)", zIndex: 9999 }}>
                        {themes.map(theme => (
                          <SelectItem key={theme.id} value={theme.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border border-white/20" style={{ background: theme.colors?.primary || "#000" }} />
                              <span style={{ fontFamily: CY.mono, fontSize: "11px" }}>{theme.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3" style={{ background: "rgba(0,6,12,0.5)", border: "1px solid rgba(0,245,255,0.08)" }}>
                    <div className="text-[9px] mb-2" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.font, letterSpacing: "0.1em" }}>CURRENT THEME COLORS</div>
                    <div className="flex gap-2">
                      {Object.entries(currentTheme.colors || {}).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="text-center">
                          <div className="w-8 h-8 border border-white/10" style={{ background: v as string }} />
                          <div className="text-[8px] mt-1" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>{k.slice(0, 5)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>
                    // Theme changes save automatically and persist across sessions
                  </div>
                </div>
              </Panel>
            )}

            {/* ── EFFECTS ── */}
            {activeTab === "effects" && (
              <Panel title="SNOW EFFECT" icon={Snowflake} color={CY.cyan}>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4"
                    style={{ background: "rgba(0,6,12,0.5)", border: "1px solid rgba(0,245,255,0.1)" }}>
                    <div>
                      <div className="text-[11px] font-bold mb-1" style={{ color: "rgba(200,240,255,0.85)", fontFamily: "Rajdhani, sans-serif" }}>SNOW PARTICLE COLOR</div>
                      <div className="text-[9px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>
                        Choose the color of falling snow particles
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px]" style={{ color: CY.cyan, fontFamily: CY.mono }}>{snowColor.toUpperCase()}</span>
                      <div className="relative">
                        <div className="w-10 h-10 border-2 cursor-pointer" style={{ background: snowColor, borderColor: "rgba(0,245,255,0.4)" }}>
                          <input type="color" value={snowColor} onChange={e => setSnowColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CyberBtn onClick={() => setSnowColor("#ffffff")} variant="primary">
                    <Snowflake className="w-3 h-3" />
                    RESET TO WHITE
                  </CyberBtn>
                  <div className="text-[10px] p-3" style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.08)", color: "rgba(0,245,255,0.35)", fontFamily: CY.mono }}>
                    // Current color: <span style={{ color: snowColor }}>{snowColor}</span> — visible on all pages
                  </div>
                </div>
              </Panel>
            )}

            {/* ── WEBHOOK ── */}
            {activeTab === "webhook" && (
              <div className="space-y-4">
                <Panel title="DISCORD WEBHOOK" icon={Webhook} color={CY.green}>
                  <Form {...webhookForm}>
                    <form onSubmit={webhookForm.handleSubmit(handleSaveWebhook)} className="space-y-4">
                      <FormField control={webhookForm.control} name="webhookUrl" render={({ field }) => (
                        <div>
                          <CyberLabel>WEBHOOK URL</CyberLabel>
                          <CyberInput type="url" placeholder="https://discord.com/api/webhooks/..." {...field} data-testid="input-webhook-url" />
                          <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                        </div>
                      )} />
                      <div className="flex items-center justify-between">
                        <CyberBtn type="submit" disabled={isLoading} variant="success" data-testid="button-save-webhook">
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {isLoading ? "SAVING..." : "SAVE WEBHOOK"}
                        </CyberBtn>
                        {currentWebhookUrl && (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CY.green, boxShadow: `0 0 4px ${CY.green}` }} />
                            <span className="text-[10px]" style={{ color: CY.green, fontFamily: CY.mono }}>WEBHOOK ACTIVE</span>
                          </div>
                        )}
                      </div>
                    </form>
                  </Form>
                </Panel>
                <div className="space-y-1.5 px-1">
                  <div className="text-[9px] font-bold tracking-widest mb-2" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.15em" }}>HOW TO GET WEBHOOK URL:</div>
                  {["Go to your Discord server settings", "Navigate to Integrations → Webhooks", "Create a new webhook", "Copy the URL and paste it above"].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[9px] w-4 flex-shrink-0" style={{ color: CY.cyan, fontFamily: CY.font }}>{i + 1}</span>
                      <span className="text-[10px]" style={{ color: "rgba(200,240,255,0.5)", fontFamily: "Rajdhani, sans-serif" }}>{step}</span>
                    </div>
                  ))}
                </div>
                {currentWebhookUrl && (
                  <div className="p-4 space-y-1.5" style={{ background: "rgba(0,255,159,0.04)", border: "1px solid rgba(0,255,159,0.15)" }}>
                    <div className="text-[9px] font-bold tracking-widest mb-2" style={{ color: CY.green, fontFamily: CY.font, letterSpacing: "0.15em" }}>WEBHOOK NOTIFICATIONS INCLUDE:</div>
                    {["Real-time IP address & location", "VPN detection with original IP", "Device fingerprinting (browser, OS)", "Security alerts for suspicious activity", "Detailed visitor analytics"].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: CY.green }} />
                        <span className="text-[10px]" style={{ color: "rgba(0,255,159,0.6)", fontFamily: CY.mono }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── BOT CONFIG ── */}
            {activeTab === "bot" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { title: "REQUIRED SCOPES", color: CY.purple, items: ["bot — Basic bot functionality", "applications.commands — Slash commands"] },
                    { title: "PERMISSIONS",     color: CY.cyan,   items: ["Send Messages", "Embed Links", "Read Message History"] },
                    { title: "COMMANDS",        color: CY.green,  items: ["/logs view — Show captured IPs", "/logs export — Export as CSV"] },
                  ].map(sec => (
                    <div key={sec.title} className="p-3" style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${sec.color}20` }}>
                      <div className="text-[9px] font-bold tracking-widest mb-2" style={{ color: sec.color, fontFamily: CY.font, letterSpacing: "0.15em" }}>{sec.title}</div>
                      {sec.items.map(item => (
                        <div key={item} className="flex items-start gap-1.5 mb-1">
                          <div className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5" style={{ background: sec.color }} />
                          <span className="text-[9px]" style={{ color: "rgba(200,240,255,0.5)", fontFamily: CY.mono }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Panel title="BOT CREDENTIALS" icon={Bot} color={CY.cyan}>
                  <Form {...botConfigForm}>
                    <form onSubmit={botConfigForm.handleSubmit(handleSaveBotConfig)} className="space-y-4">
                      {[
                        { name: "discordBotToken" as const,  label: "BOT TOKEN",  placeholder: "Your Discord bot token", type: "password", hint: "Found under Bot → TOKEN in Discord Developer Portal" },
                        { name: "discordServerId" as const,  label: "SERVER ID",  placeholder: "Your Discord server ID", type: "text", hint: "Right-click your server → Copy Server ID (Dev Mode on)" },
                        { name: "discordChannelId" as const, label: "CHANNEL ID", placeholder: "Channel ID for /logs command", type: "text", hint: "Right-click channel → Copy Channel ID" },
                      ].map(f => (
                        <FormField key={f.name} control={botConfigForm.control} name={f.name} render={({ field }) => (
                          <div>
                            <CyberLabel>{f.label}</CyberLabel>
                            <CyberInput type={f.type} placeholder={f.placeholder} {...field} />
                            <p className="text-[9px] mt-1" style={{ color: "rgba(0,245,255,0.25)", fontFamily: CY.mono }}>{f.hint}</p>
                            <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                          </div>
                        )} />
                      ))}
                      <CyberBtn type="submit" disabled={isLoading} variant="primary">
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {isLoading ? "SAVING..." : "SAVE BOT CONFIG"}
                      </CyberBtn>
                    </form>
                  </Form>
                </Panel>
                <div className="flex items-start gap-3 p-3" style={{ background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.2)" }}>
                  <Cpu className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: CY.yellow }} />
                  <div className="text-[10px]" style={{ color: "rgba(255,200,0,0.7)", fontFamily: CY.mono }}>
                    After saving, use <code className="px-1 py-0.5 mx-0.5" style={{ background: "rgba(255,200,0,0.1)", border: "1px solid rgba(255,200,0,0.2)" }}>/logs view</code> in your configured channel to display all captured IPs
                  </div>
                </div>
              </div>
            )}

            {/* ── DEV USERS ── */}
            {activeTab === "dev-users" && user?.isDev && (
              <div className="space-y-4">
                <Panel title="CREATE NEW USER" icon={UserPlus} color={CY.green}>
                  <Form {...createUserForm}>
                    <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={createUserForm.control} name="username" render={({ field }) => (
                          <div>
                            <CyberLabel>USERNAME</CyberLabel>
                            <CyberInput placeholder="Enter username" {...field} />
                            <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                          </div>
                        )} />
                        <FormField control={createUserForm.control} name="password" render={({ field }) => (
                          <div>
                            <CyberLabel>PASSWORD</CyberLabel>
                            <CyberInput type="password" placeholder="Enter password" {...field} />
                            <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                          </div>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={createUserForm.control} name="accountType" render={({ field }) => (
                          <div>
                            <CyberLabel>ACCOUNT TYPE</CyberLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-9 text-[10px]" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#e0f8ff", fontFamily: CY.mono }}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent style={{ background: "#000d1a", border: "1px solid rgba(0,245,255,0.2)", zIndex: 9999 }}>
                                <SelectItem value="user">Regular User</SelectItem>
                                <SelectItem value="tester">Testing Account</SelectItem>
                                <SelectItem value="developer">Developer Account</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )} />
                        <FormField control={createUserForm.control} name="isDev" render={({ field }) => (
                          <div>
                            <CyberLabel>DEV PRIVILEGES</CyberLabel>
                            <div className="flex items-center gap-2 py-2">
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                              <span className="text-[10px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                                {field.value ? "ENABLED" : "DISABLED"}
                              </span>
                            </div>
                          </div>
                        )} />
                      </div>
                      <CyberBtn type="submit" disabled={isLoading} variant="success">
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                        {isLoading ? "CREATING..." : "CREATE USER"}
                      </CyberBtn>
                    </form>
                  </Form>
                </Panel>

                <Panel title="ALL USERS" icon={Eye} color={CY.cyan}>
                  {isLoadingUsers ? (
                    <div className="py-8 text-center text-[10px] animate-pulse" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>LOADING USERS...</div>
                  ) : (
                    <div className="space-y-2">
                      {devUsers.map((u: any) => (
                        <div key={u.id} style={{ background: "rgba(0,245,255,0.03)", border: `1px solid ${editingUser?.id === u.id ? "rgba(160,80,255,0.3)" : "rgba(0,245,255,0.08)"}` }}>
                          {/* User row */}
                          <div className="flex items-center justify-between p-3">
                            <div>
                              <div className="text-[11px] font-bold" style={{ color: "rgba(200,240,255,0.9)", fontFamily: "Rajdhani, sans-serif" }}>{u.username}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] px-1.5 py-0.5" style={{ color: u.isDev ? CY.purple : CY.cyan, background: u.isDev ? "rgba(160,80,255,0.1)" : "rgba(0,245,255,0.08)", border: `1px solid ${u.isDev ? "rgba(160,80,255,0.3)" : "rgba(0,245,255,0.2)"}`, fontFamily: CY.font, letterSpacing: "0.1em" }}>
                                  {u.isDev ? "DEV" : u.accountType?.toUpperCase() || "USER"}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5" style={{ color: u.isBanned ? CY.red : CY.green, background: u.isBanned ? "rgba(255,80,80,0.08)" : "rgba(0,255,159,0.08)", border: `1px solid ${u.isBanned ? "rgba(255,80,80,0.25)" : "rgba(0,255,159,0.25)"}`, fontFamily: CY.font }}>
                                  {u.isBanned ? "BANNED" : "ACTIVE"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <CyberBtn small variant="purple"
                                onClick={() => {
                                  if (editingUser?.id === u.id) { setEditingUser(null); }
                                  else { setEditingUser(u); editRoleForm.setValue("accountType", u.accountType || "user"); editRoleForm.setValue("isDev", u.isDev || false); }
                                }}>
                                <Shield className="w-3 h-3" />
                                {editingUser?.id === u.id ? "CANCEL" : "ROLE"}
                              </CyberBtn>
                              {!u.isBanned
                                ? <CyberBtn small variant="warning" onClick={() => handleBanUser(u.id, "Admin action")}><Ban className="w-3 h-3" />BAN</CyberBtn>
                                : <CyberBtn small variant="success" onClick={() => handleUnbanUser(u.id)}><UserCheck className="w-3 h-3" />UNBAN</CyberBtn>
                              }
                              <CyberBtn small variant="danger" onClick={() => handleDeleteUser(u.id)}><Trash2 className="w-3 h-3" /></CyberBtn>
                            </div>
                          </div>
                          {/* Inline role editor */}
                          {editingUser?.id === u.id && (
                            <div className="px-3 pb-3 border-t" style={{ borderColor: "rgba(160,80,255,0.2)", background: "rgba(160,80,255,0.04)" }}>
                              <div className="pt-3">
                                <div className="text-[9px] font-bold tracking-widest mb-3" style={{ color: CY.purple, fontFamily: CY.font, letterSpacing: "0.15em" }}>EDIT ROLE — {u.username.toUpperCase()}</div>
                                <Form {...editRoleForm}>
                                  <form onSubmit={editRoleForm.handleSubmit(handleEditRole)} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <FormField control={editRoleForm.control} name="accountType" render={({ field }) => (
                                        <div>
                                          <CyberLabel>ACCOUNT TYPE</CyberLabel>
                                          <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-8 text-[10px]" style={{ background: "rgba(0,245,255,0.04)", border: "1px solid rgba(160,80,255,0.3)", color: "#e0f8ff", fontFamily: CY.mono }}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent style={{ background: "#000d1a", border: "1px solid rgba(160,80,255,0.3)", zIndex: 9999 }}>
                                              <SelectItem value="user">User</SelectItem>
                                              <SelectItem value="tester">Tester</SelectItem>
                                              <SelectItem value="developer">Developer</SelectItem>
                                              <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )} />
                                      <FormField control={editRoleForm.control} name="isDev" render={({ field }) => (
                                        <div>
                                          <CyberLabel>DEV PRIVILEGES</CyberLabel>
                                          <div className="flex items-center gap-2 h-8">
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            <span className="text-[10px]" style={{ color: field.value ? CY.purple : "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                                              {field.value ? "ENABLED" : "DISABLED"}
                                            </span>
                                          </div>
                                        </div>
                                      )} />
                                    </div>
                                    <CyberBtn type="submit" disabled={isLoading} variant="purple">
                                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                                      {isLoading ? "SAVING..." : "SAVE ROLE"}
                                    </CyberBtn>
                                  </form>
                                </Form>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {devUsers.length === 0 && (
                        <div className="py-8 text-center text-[10px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>NO USERS FOUND</div>
                      )}
                    </div>
                  )}
                </Panel>
              </div>
            )}

            {/* ── DEV KEYS ── */}
            {activeTab === "dev-keys" && user?.isDev && (
              <div className="space-y-4">
                <Panel title="CREATE ACCESS KEY" icon={Key} color={CY.yellow}>
                  <Form {...keyForm}>
                    <form onSubmit={keyForm.handleSubmit(handleCreateKey)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={keyForm.control} name="key" render={({ field }) => (
                          <div>
                            <CyberLabel>ACCESS KEY</CyberLabel>
                            <CyberInput placeholder="Key string..." {...field} />
                            <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                          </div>
                        )} />
                        <FormField control={keyForm.control} name="usageLimit" render={({ field }) => (
                          <div>
                            <CyberLabel>USAGE LIMIT</CyberLabel>
                            <CyberInput type="number" placeholder="e.g. 100" {...field} />
                            <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                          </div>
                        )} />
                      </div>
                      <FormField control={keyForm.control} name="expirationDays" render={({ field }) => (
                        <div>
                          <CyberLabel>EXPIRATION DAYS {user?.isDev ? "(BLANK = UNLIMITED)" : "(MAX 365)"}</CyberLabel>
                          <CyberInput type="number" placeholder={user?.isDev ? "Leave empty for unlimited..." : "Max 365 days"} {...field} />
                        </div>
                      )} />
                      <CyberBtn type="submit" variant="warning">
                        <Key className="w-3 h-3" />
                        CREATE KEY
                      </CyberBtn>
                    </form>
                  </Form>
                </Panel>

                <Panel title="ACTIVE KEYS" icon={Key} color={CY.cyan}>
                  {isLoadingKeys ? (
                    <div className="py-8 text-center text-[10px] animate-pulse" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>LOADING KEYS...</div>
                  ) : (
                    <div className="space-y-2">
                      {devKeys.map((k: any) => (
                        <div key={k.id} className="flex items-center justify-between p-3"
                          style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.08)" }}>
                          <div>
                            <code className="text-[11px]" style={{ color: CY.cyan, fontFamily: CY.mono }}>{k.key}</code>
                            <div className="text-[9px] mt-0.5" style={{ color: "rgba(0,245,255,0.35)", fontFamily: CY.mono }}>
                              {k.usageCount}/{k.usageLimit} uses · {k.expirationDays ? `${k.expirationDays}d expiry` : "unlimited"}
                            </div>
                          </div>
                          <CyberBtn small variant="danger" onClick={() => handleDeleteKey(k.id)}><Trash2 className="w-3 h-3" /></CyberBtn>
                        </div>
                      ))}
                      {devKeys.length === 0 && (
                        <div className="py-8 text-center text-[10px]" style={{ color: "rgba(0,245,255,0.3)", fontFamily: CY.mono }}>NO KEYS FOUND</div>
                      )}
                    </div>
                  )}
                </Panel>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
