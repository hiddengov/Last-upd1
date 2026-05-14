import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Camera, Lock, Save, Loader2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfileSchema, updatePasswordSchema } from "@shared/schema";
import type { UpdateProfile, UpdatePassword, User as UserType } from "@shared/schema";
import Sidebar from "@/components/dashboard/sidebar";

const CY = {
  font: "Orbitron, sans-serif",
  mono: "JetBrains Mono, monospace",
  cyan: "#00f5ff",
  green: "#00ff9f",
  purple: "#a050ff",
  yellow: "#ffc800",
  red: "#ff5050",
};

function CyberInput({ ...props }: any) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-xs outline-none transition-all"
      style={{
        background: "rgba(0,245,255,0.04)",
        border: "1px solid rgba(0,245,255,0.2)",
        color: "#e0f8ff",
        fontFamily: CY.mono,
        fontSize: "12px",
        ...(props.style || {}),
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0,245,255,0.08)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function CyberLabel({ children }: any) {
  return (
    <span className="block mb-1.5 text-[9px] tracking-widest uppercase"
      style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.font, letterSpacing: "0.2em" }}>
      {children}
    </span>
  );
}

function CyberBtn({ children, type = "button", onClick, disabled, variant = "primary" }: any) {
  const v: Record<string, any> = {
    primary: { bg: "rgba(0,245,255,0.1)",  border: "rgba(0,245,255,0.4)",  color: "#00f5ff" },
    warning: { bg: "rgba(255,200,0,0.08)", border: "rgba(255,200,0,0.4)",  color: "#ffc800" },
    success: { bg: "rgba(0,255,159,0.08)", border: "rgba(0,255,159,0.4)",  color: "#00ff9f" },
  };
  const s = v[variant] || v.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: CY.font, letterSpacing: "0.15em", cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </button>
  );
}

function Panel({ title, icon: Icon, color = CY.cyan, children }: any) {
  return (
    <div style={{ background: "rgba(0,6,12,0.7)", border: `1px solid ${color}25` }}>
      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: `${color}18`, background: "rgba(0,8,20,0.6)" }}>
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
        <span className="text-[11px] font-bold tracking-widest"
          style={{ fontFamily: CY.font, color, letterSpacing: "0.2em" }}>
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery<UserType>({ queryKey: ["/api/user"] });

  const profileForm = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { username: user?.username || "", profilePicture: user?.profilePicture || "" },
    values: { username: user?.username || "", profilePicture: user?.profilePicture || "" },
  });

  const passwordForm = useForm<UpdatePassword>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Profile update failed"); }
      return res.json();
    },
    onSuccess: () => { toast({ title: "PROFILE UPDATED" }); queryClient.invalidateQueries({ queryKey: ["/api/user"] }); },
    onError: (e: Error) => toast({ title: "UPDATE FAILED", description: e.message, variant: "destructive" }),
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: UpdatePassword) => {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Password update failed"); }
      return res.json();
    },
    onSuccess: () => { toast({ title: "PASSWORD UPDATED" }); passwordForm.reset(); },
    onError: (e: Error) => toast({ title: "UPDATE FAILED", description: e.message, variant: "destructive" }),
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "FILE TOO LARGE", description: "Max 5MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setProfilePicturePreview(b64);
      profileForm.setValue("profilePicture", b64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#000508" }}>
      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#00f5ff 0px,#00f5ff 1px,transparent 1px,transparent 4px)" }} />
      <div className="fixed top-0 left-64 w-96 h-96 pointer-events-none z-0 opacity-10"
        style={{ background: "radial-gradient(circle at top, rgba(160,80,255,0.3), transparent 70%)" }} />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 pb-16 md:pb-0" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 md:px-6 py-4 border-b"
          style={{ background: "rgba(0,4,12,0.97)", borderColor: "rgba(160,80,255,0.2)", backdropFilter: "blur(20px)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(160,80,255,0.6) 30%, rgba(0,245,255,0.6) 70%, transparent)" }} />
          <div className="flex items-center gap-3">
            <User className="w-4 h-4" style={{ color: CY.purple, filter: "drop-shadow(0 0 6px rgba(160,80,255,0.8))" }} />
            <div>
              <h1 className="text-base md:text-lg font-black tracking-widest"
                style={{ fontFamily: CY.font, color: CY.purple, textShadow: "0 0 15px rgba(160,80,255,0.5)", letterSpacing: "0.2em" }}>
                AGENT PROFILE
              </h1>
              <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                // IDENTITY & SECURITY MANAGEMENT
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4 max-w-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 animate-spin" style={{ borderColor: "rgba(0,245,255,0.1)", borderTopColor: "#00f5ff" }} />
            </div>
          ) : (
            <>
              {/* Profile Information */}
              <Panel title="IDENTITY MATRIX" icon={User} color={CY.purple}>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-20 h-20 flex items-center justify-center overflow-hidden"
                          style={{ background: "rgba(160,80,255,0.1)", border: "2px solid rgba(160,80,255,0.4)" }}>
                          {(profilePicturePreview || user?.profilePicture) ? (
                            <img src={profilePicturePreview || user?.profilePicture || ""} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-black"
                              style={{ fontFamily: CY.font, color: CY.purple }}>
                              {user?.username?.[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <label htmlFor="profile-picture"
                          className="absolute -bottom-1.5 -right-1.5 w-7 h-7 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                          style={{ background: "rgba(0,245,255,0.15)", border: "1px solid rgba(0,245,255,0.4)" }}>
                          <Camera className="w-3.5 h-3.5" style={{ color: CY.cyan }} />
                        </label>
                        <input id="profile-picture" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                      </div>
                      <div>
                        <div className="text-sm font-bold mb-0.5" style={{ color: "rgba(200,240,255,0.9)", fontFamily: "Rajdhani, sans-serif" }}>
                          {user?.username}
                        </div>
                        <div className="text-[10px]" style={{ color: "rgba(0,245,255,0.4)", fontFamily: CY.mono }}>
                          Click camera to upload avatar • Max 5MB
                        </div>
                        <div className="text-[9px] mt-1 px-2 py-0.5 inline-block"
                          style={{ background: "rgba(160,80,255,0.1)", border: "1px solid rgba(160,80,255,0.3)", color: CY.purple, fontFamily: CY.font, letterSpacing: "0.15em" }}>
                          {user?.isDev ? "DEV" : user?.accountType?.toUpperCase() || "USER"}
                        </div>
                      </div>
                    </div>

                    {/* Username */}
                    <FormField control={profileForm.control} name="username" render={({ field }) => (
                      <div>
                        <CyberLabel>USERNAME</CyberLabel>
                        <CyberInput type="text" placeholder="Enter username..." {...field} data-testid="input-username" />
                        <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                      </div>
                    )} />

                    <CyberBtn type="submit" variant="primary" disabled={profileMutation.isPending}>
                      {profileMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {profileMutation.isPending ? "SAVING..." : "SAVE CHANGES"}
                    </CyberBtn>
                  </form>
                </Form>
              </Panel>

              {/* Password */}
              <Panel title="SECURITY PROTOCOL" icon={Lock} color={CY.yellow}>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4">
                    {[
                      { name: "currentPassword" as const, label: "CURRENT PASSWORD", placeholder: "Current password..." },
                      { name: "password" as const,        label: "NEW PASSWORD",     placeholder: "New password..." },
                      { name: "confirmPassword" as const, label: "CONFIRM PASSWORD", placeholder: "Confirm new password..." },
                    ].map(({ name, label, placeholder }) => (
                      <FormField key={name} control={passwordForm.control} name={name} render={({ field }) => (
                        <div>
                          <CyberLabel>{label}</CyberLabel>
                          <CyberInput type="password" placeholder={placeholder} {...field} />
                          <FormMessage className="text-[10px] mt-1" style={{ color: CY.red }} />
                        </div>
                      )} />
                    ))}
                    <CyberBtn type="submit" variant="warning" disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                      {passwordMutation.isPending ? "UPDATING..." : "UPDATE PASSWORD"}
                    </CyberBtn>
                  </form>
                </Form>
              </Panel>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
