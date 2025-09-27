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

  const { data: extensionLogs, isLoading: extensionLogsLoading } = useQuery({
    queryKey: ['/api/extension-logs'],
    enabled: isAdmin,
  });

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

            {/* Other tabs content (placeholders for now) */}
            <TabsContent value="user-management" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    User management features will be implemented here.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system-monitor" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle>System Monitor</CardTitle>
                  <CardDescription>Monitor system performance and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    System monitoring features will be implemented here.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="extension-activity" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <Card className="bg-card/80 backdrop-blur-md border-border">
                <CardHeader>
                  <CardTitle>Extension Activity</CardTitle>
                  <CardDescription>Monitor extension usage and data collection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Extension activity monitoring will be implemented here.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}