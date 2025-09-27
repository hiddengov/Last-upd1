import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import Sidebar from "@/components/dashboard/sidebar";
import SnowEffect from "@/components/ui/snow-effect";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Key, 
  Users, 
  Activity, 
  Plus, 
  Trash2, 
  Calendar, 
  Shield, 
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Download
} from "lucide-react";

// Form schemas
const singleKeySchema = z.object({
  key: z.string().min(1, "Key is required"),
  usageLimit: z.coerce.number().min(1, "Usage limit must be at least 1"),
  expirationDays: z.coerce.number().optional(),
});

const bulkKeySchema = z.object({
  keyPrefix: z.string().min(1, "Key prefix is required"),
  keyCount: z.coerce.number().min(1, "Key count must be at least 1").max(999999, "Maximum 999,999 keys allowed"),
  usageLimit: z.coerce.number().min(1, "Usage limit must be at least 1"),
  expirationDays: z.coerce.number().optional(),
});

const webhookSchema = z.object({
  webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

interface AdminPanelProps {}

export default function AdminPanel({}: AdminPanelProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("key-management");
  const [bulkKeysDialogOpen, setBulkKeysDialogOpen] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [banReason, setBanReason] = useState("");

  // Check if user is admin/dev
  const isAdmin = user?.isDev || user?.accountType === 'admin' || user?.accountType === 'developer';

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      setLocation('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive"
      });
    }
  }, [isAdmin, setLocation, toast]);

  // Forms
  const singleKeyForm = useForm<z.infer<typeof singleKeySchema>>({
    resolver: zodResolver(singleKeySchema),
    defaultValues: {
      key: "",
      usageLimit: 100,
      expirationDays: undefined,
    }
  });

  const bulkKeyForm = useForm<z.infer<typeof bulkKeySchema>>({
    resolver: zodResolver(bulkKeySchema),
    defaultValues: {
      keyPrefix: "",
      keyCount: 1,
      usageLimit: 100,
      expirationDays: undefined,
    }
  });

  const webhookForm = useForm<z.infer<typeof webhookSchema>>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      webhookUrl: "",
    }
  });

  // Queries
  const { data: allKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['/api/admin/keys'],
    enabled: isAdmin,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });

  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: extensionLogsData, isLoading: extensionLogsLoading } = useQuery({
    queryKey: ['/api/extension-logs'],
    enabled: isAdmin,
  });

  const extensionLogs = Array.isArray(extensionLogsData?.logs) ? extensionLogsData.logs : 
                       Array.isArray(extensionLogsData) ? extensionLogsData : [];

  // Mutations
  const createSingleKeyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof singleKeySchema>) => {
      const res = await apiRequest('POST', '/api/admin/create-key', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Access key created successfully."
      });
      singleKeyForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/keys'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create access key",
        variant: "destructive"
      });
    }
  });

  const createBulkKeysMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bulkKeySchema>) => {
      const res = await apiRequest('POST', '/api/admin/create-bulk-keys', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Created ${data.keys.length} access keys successfully.`
      });
      setGeneratedKeys(data.keys);
      bulkKeyForm.reset();
      setBulkKeysDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/keys'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk keys",
        variant: "destructive"
      });
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/keys/${keyId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Access key deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/keys'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete access key",
        variant: "destructive"
      });
    }
  });

  const updateWebhookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof webhookSchema>) => {
      const res = await apiRequest('POST', '/api/admin/webhook', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Webhook URL updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update webhook",
        variant: "destructive"
      });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/ban`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been banned successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive"
      });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/unban`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been unbanned successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Key copied to clipboard.",
    });
  };

  const exportKeys = () => {
    if (generatedKeys.length === 0) return;
    
    const keysText = generatedKeys.join('\n');
    const blob = new Blob([keysText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-keys.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Keys Exported",
      description: "Generated keys have been saved to file.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getKeyStatus = (key: any) => {
    if (!key.isActive) return "inactive";
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "expired";
    if (key.usedCount >= key.usageLimit) return "depleted";
    return "active";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-500", text: "Active" },
      inactive: { color: "bg-gray-500", text: "Inactive" },
      expired: { color: "bg-red-500", text: "Expired" },
      depleted: { color: "bg-orange-500", text: "Depleted" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const maskIpAddress = (ip: string) => {
    if (!ip) return 'Hidden';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.**`;
    }
    return 'Hidden';
  };

  const handleBanUser = (userId: string, reason: string) => {
    banUserMutation.mutate({ userId, reason });
    setBanReason(""); // Clear the reason after banning
  };

  const handleUnbanUser = (userId: string) => {
    unbanUserMutation.mutate(userId);
  };

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <SnowEffect color="#ffffff" glow={true} density={60} speed={1.2} />
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="animate-slide-in-up">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground drop-shadow-lg flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-500" />
                Admin Panel
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Manage keys, users, and system settings</p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-md border-border animate-slide-in-up">
              <TabsTrigger 
                value="key-management" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-key-management"
              >
                <Key className="w-4 h-4 mr-2" />
                Key Management
              </TabsTrigger>
              <TabsTrigger 
                value="user-management" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-user-management"
              >
                <Users className="w-4 h-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="system-monitor" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-system-monitor"
              >
                <Activity className="w-4 h-4 mr-2" />
                System Monitor
              </TabsTrigger>
              <TabsTrigger 
                value="extension-activity" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground backdrop-blur-sm transition-all duration-300"
                data-testid="tab-extension-activity"
              >
                <Database className="w-4 h-4 mr-2" />
                Extension Activity
              </TabsTrigger>
            </TabsList>

            {/* Key Management Tab */}
            <TabsContent value="key-management" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Create Single Key */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-500" />
                      Create Single Key
                    </CardTitle>
                    <CardDescription>Create a single access key with custom settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...singleKeyForm}>
                      <form onSubmit={singleKeyForm.handleSubmit((data) => createSingleKeyMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={singleKeyForm.control}
                          name="key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Key Value</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter key value" {...field} data-testid="input-single-key-value" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={singleKeyForm.control}
                          name="usageLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage Limit</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="100" {...field} data-testid="input-single-key-usage-limit" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={singleKeyForm.control}
                          name="expirationDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiration Days (Optional)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Leave empty for no expiration" {...field} data-testid="input-single-key-expiration" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={createSingleKeyMutation.isPending}
                          className="w-full"
                          data-testid="button-create-single-key"
                        >
                          {createSingleKeyMutation.isPending ? "Creating..." : "Create Key"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Create Bulk Keys */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-500" />
                      Create Bulk Keys
                    </CardTitle>
                    <CardDescription>Create multiple keys at once (up to 999,999)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...bulkKeyForm}>
                      <form onSubmit={bulkKeyForm.handleSubmit((data) => createBulkKeysMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={bulkKeyForm.control}
                          name="keyPrefix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Key Prefix</FormLabel>
                              <FormControl>
                                <Input placeholder="bulk-key" {...field} data-testid="input-bulk-key-prefix" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={bulkKeyForm.control}
                          name="keyCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Keys</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="10" min="1" max="999999" {...field} data-testid="input-bulk-key-count" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={bulkKeyForm.control}
                          name="usageLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage Limit Per Key</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="100" {...field} data-testid="input-bulk-key-usage-limit" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={bulkKeyForm.control}
                          name="expirationDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiration Days (Optional)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Leave empty for no expiration" {...field} data-testid="input-bulk-key-expiration" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={createBulkKeysMutation.isPending}
                          className="w-full"
                          data-testid="button-create-bulk-keys"
                        >
                          {createBulkKeysMutation.isPending ? "Creating..." : "Create Bulk Keys"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Generated Keys Display */}
              {generatedKeys.length > 0 && (
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        Generated Keys ({generatedKeys.length})
                      </span>
                      <Button 
                        onClick={exportKeys} 
                        size="sm" 
                        variant="outline"
                        data-testid="button-export-generated-keys"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {generatedKeys.map((key, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <code className="text-sm font-mono">{key}</code>
                          <Button 
                            onClick={() => copyToClipboard(key)} 
                            size="sm" 
                            variant="ghost"
                            data-testid={`button-copy-key-${index}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Keys Table */}
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-500" />
                    All Access Keys
                  </CardTitle>
                  <CardDescription>Manage and monitor all access keys</CardDescription>
                </CardHeader>
                <CardContent>
                  {keysLoading ? (
                    <div className="text-center py-8">Loading keys...</div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(allKeys as any[])?.map((key: any) => (
                            <TableRow key={key.id} data-testid={`row-key-${key.id}`}>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">{key.key}</code>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(getKeyStatus(key))}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {key.usedCount} / {key.usageLimit}
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${Math.min((key.usedCount / key.usageLimit) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(key.createdAt)}</TableCell>
                              <TableCell>
                                {key.expiresAt ? formatDate(key.expiresAt) : "Never"}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  onClick={() => deleteKeyMutation.mutate(key.id)}
                                  size="sm" 
                                  variant="destructive"
                                  disabled={deleteKeyMutation.isPending}
                                  data-testid={`button-delete-key-${key.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="user-management" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    All Users
                  </CardTitle>
                  <CardDescription>Manage user accounts and view credentials (Admin/Dev access only)</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Password Hash</TableHead>
                            <TableHead>Account Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(allUsers as any[])?.map((user: any) => (
                            <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm bg-muted px-2 py-1 rounded">{user.username}</code>
                                  {user.isDev && <Badge className="bg-purple-500">DEV</Badge>}
                                  {user.isBanned && <Badge variant="destructive">BANNED</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded break-all">
                                  {user.password?.substring(0, 20)}...
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.accountType === 'admin' ? 'default' : user.accountType === 'developer' ? 'secondary' : 'outline'}>
                                  {user.accountType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.isBanned ? (
                                  <Badge variant="destructive">Banned</Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-500">Active</Badge>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell>
                                {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" disabled>Edit</Button>
                                  {user.isBanned ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleUnbanUser(user.id)}
                                      disabled={unbanUserMutation.isPending}
                                    >
                                      Unban
                                    </Button>
                                  ) : (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          disabled={user.id === req?.user?.id || (user.isDev && user.accountType === 'admin')}
                                        >
                                          Ban
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Ban User</DialogTitle>
                                          <DialogDescription>
                                            Enter a reason for banning {user.username}:
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label htmlFor="banReason">Ban Reason</Label>
                                            <Input
                                              id="banReason"
                                              placeholder="Enter reason for ban..."
                                              onChange={(e) => setBanReason(e.target.value)}
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button
                                            variant="destructive"
                                            onClick={() => {
                                              if (banReason.trim()) {
                                                handleBanUser(user.id, banReason);
                                              }
                                            }}
                                            disabled={banUserMutation.isPending || !banReason.trim()}
                                          >
                                            Ban User
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Monitor Tab */}
            <TabsContent value="system-monitor" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* System Statistics */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-500" />
                      System Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {statsLoading ? (
                      <div>Loading stats...</div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Users:</span>
                          <span className="font-medium">{systemStats?.totalUsers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Active Keys:</span>
                          <span className="font-medium">{systemStats?.activeKeys || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Keys:</span>
                          <span className="font-medium">{systemStats?.totalKeys || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP Logs:</span>
                          <span className="font-medium">{systemStats?.totalLogs || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Extensions:</span>
                          <span className="font-medium">{systemStats?.totalExtensions || 0}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Server Health */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Server Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-medium">
                        {Math.floor(Date.now() / 1000 / 60 / 60)} hours
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory:</span>
                      <span className="font-medium">Normal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database:</span>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Health:</span>
                      <Badge className="bg-green-500">Healthy</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-500" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Response:</span>
                      <span className="font-medium">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requests/min:</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Error Rate:</span>
                      <span className="font-medium text-green-500">0.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cache Hit:</span>
                      <span className="font-medium">89%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Load:</span>
                      <Badge variant="outline">Light</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent System Events */}
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Recent System Events
                  </CardTitle>
                  <CardDescription>Latest system activities and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">System startup completed</span>
                      </div>
                      <span className="text-xs text-muted-foreground">2 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">New access key created</span>
                      </div>
                      <span className="text-xs text-muted-foreground">5 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Extension generated successfully</span>
                      </div>
                      <span className="text-xs text-muted-foreground">8 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Database backup completed</span>
                      </div>
                      <span className="text-xs text-muted-foreground">15 minutes ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Extension Activity Tab */}
            <TabsContent value="extension-activity" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Extension Statistics */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-500" />
                      Extension Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Generated:</span>
                      <span className="font-medium">{extensionLogs.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Successful:</span>
                      <span className="font-medium text-green-500">
                        {extensionLogs.filter((log: any) => log.generationStatus === 'success').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed:</span>
                      <span className="font-medium text-red-500">
                        {extensionLogs.filter((log: any) => log.generationStatus === 'error').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Hour:</span>
                      <span className="font-medium">
                        {extensionLogs.filter((log: any) => 
                          new Date(log.createdAt) > new Date(Date.now() - 60 * 60 * 1000)
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Downloads:</span>
                      <span className="font-medium">
                        {extensionLogs.reduce((acc: number, log: any) => acc + (log.downloadCount || 0), 0) || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Features */}
                <Card className="bg-card/80 backdrop-blur-md border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Popular Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Tracking:</span>
                      <Badge variant="secondary">
                        {extensionLogs.filter((log: any) => log.features?.includes('ip_tracking')).length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Screenshots:</span>
                      <Badge variant="secondary">
                        {extensionLogs.filter((log: any) => log.features?.includes('screenshot')).length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Keylogger:</span>
                      <Badge variant="secondary">
                        {extensionLogs.filter((log: any) => log.features?.includes('keylogger')).length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Form Data:</span>
                      <Badge variant="secondary">
                        {extensionLogs.filter((log: any) => log.features?.includes('form_data')).length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Geolocation:</span>
                      <Badge variant="secondary">
                        {extensionLogs.filter((log: any) => log.features?.includes('geolocation')).length || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Extension Activity */}
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Recent Extension Activity
                  </CardTitle>
                  <CardDescription>Latest extension generations and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {extensionLogsLoading ? (
                    <div className="text-center py-8">Loading extension activity...</div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Extension Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extensionLogs.slice(0, 10).map((log: any) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div>
                                  <code className="text-sm bg-muted px-2 py-1 rounded">{log.extensionName}</code>
                                  <div className="text-xs text-muted-foreground mt-1">v{log.extensionVersion}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={log.generationStatus === 'success' ? 'default' : 'destructive'}
                                  className={log.generationStatus === 'success' ? 'bg-green-500' : ''}
                                >
                                  {log.generationStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {log.features?.slice(0, 3).map((feature: string) => (
                                    <Badge key={feature} variant="outline" className="text-xs">
                                      {feature.replace('_', ' ')}
                                    </Badge>
                                  ))}
                                  {log.features?.length > 3 && (
                                    <Badge variant="outline" className="text-xs">+{log.features.length - 3}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs text-muted-foreground">{maskIpAddress(log.ipAddress)}</code>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{log.location}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{formatFileSize(log.zipFileSize || 0)}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{formatDate(log.createdAt)}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}