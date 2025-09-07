import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Key, Shield, UserPlus, Ban, Trash2, UserCheck, Eye, ArrowLeft, Palette, Webhook } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import * as z from "zod";

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountType: z.enum(["user", "testing", "developer"]),
  isDev: z.boolean().default(false)
});

const createKeySchema = z.object({
  key: z.string().min(1, "Key is required"),
  usageLimit: z.string().min(1, "Usage limit is required")
});

const banUserSchema = z.object({
  reason: z.string().min(1, "Ban reason is required")
});

const webhookSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid Discord webhook URL").optional().or(z.literal(""))
});

export default function SettingsPage() {
  const { user, token } = useAuth();
  const { currentTheme, themes, setTheme } = useTheme();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Developer-only state
  const [devUsers, setDevUsers] = useState([]);
  const [devKeys, setDevKeys] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  // Webhook settings state
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState("");

  // Forms
  const createUserForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      accountType: "user",
      isDev: false
    }
  });

  const createKeyForm = useForm({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      key: "",
      usageLimit: "1"
    }
  });

  const banUserForm = useForm({
    resolver: zodResolver(banUserSchema),
    defaultValues: {
      reason: ""
    }
  });

  const webhookForm = useForm({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      webhookUrl: ""
    }
  });

  // Load developer data and webhook settings
  useEffect(() => {
    if (user?.isDev) {
      loadDevUsers();
      loadDevKeys();
    }
    loadWebhookSettings();
  }, [user]);

  const loadWebhookSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const settings = await response.json();
        const webhookUrl = settings.webhookUrl || "";
        setCurrentWebhookUrl(webhookUrl);
        webhookForm.setValue('webhookUrl', webhookUrl);
      }
    } catch (error) {
      console.error('Error loading webhook settings:', error);
    }
  };

  const handleSaveWebhook = async (data: z.infer<typeof webhookSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ webhookUrl: data.webhookUrl || null })
      });

      if (response.ok) {
        setCurrentWebhookUrl(data.webhookUrl || "");
        toast({
          title: "Success",
          description: "Webhook URL saved successfully"
        });
      } else {
        throw new Error('Failed to save webhook URL');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save webhook URL",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDevUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/dev/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const users = await response.json();
        setDevUsers(users);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadDevKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const response = await fetch('/api/dev/keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const keys = await response.json();
        setDevKeys(keys);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load access keys",
        variant: "destructive"
      });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleCreateUser = async (data: z.infer<typeof createUserSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dev/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully"
        });
        createUserForm.reset();
        loadDevUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (data: z.infer<typeof createKeySchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dev/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: data.key,
          usageLimit: parseInt(data.usageLimit)
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access key created successfully"
        });
        createKeyForm.reset();
        loadDevKeys();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create key",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create key",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch(`/api/dev/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User banned successfully"
        });
        loadDevUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to ban user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive"
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/dev/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User unbanned successfully"
        });
        loadDevUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to unban user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/dev/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully"
        });
        loadDevUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/dev/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access key deleted successfully"
        });
        loadDevKeys();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete key",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete key",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="mr-2 animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Settings className="h-8 w-8 text-primary animate-spin-slow" />
        <h1 className="text-3xl font-bold animate-fade-in-down">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className={`grid w-full ${user?.isDev ? 'grid-cols-5' : 'grid-cols-3'} animate-fade-in-up`}>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          {user?.isDev && <TabsTrigger value="dev-users">User Management</TabsTrigger>}
          {user?.isDev && <TabsTrigger value="dev-keys">Access Keys</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="animate-card animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <p className="text-lg font-medium">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                <div className="flex items-center space-x-2">
                  <Badge variant={user?.isDev ? "default" : "secondary"}>
                    {user?.isDev ? "Developer" : "User"}
                  </Badge>
                  {user?.isDev && <Shield className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card className="animate-card animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="text-sm font-medium">Choose Theme</label>
                <Select value={currentTheme.id} onValueChange={setTheme}>
                  <SelectTrigger className="w-full animate-fade-in">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id} className="animate-fade-in">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full border animate-pulse"
                            style={{ backgroundColor: theme.colors?.primary || '#000' }}
                          ></div>
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2 animate-fade-in">
                  Theme changes are saved automatically and persist across sessions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-6">
          <Card className="p-6 animate-card animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Webhook className="h-5 w-5" />
                <span>Discord Webhook</span>
              </CardTitle>
              <CardDescription>
                Configure Discord webhook URL to receive real-time IP logging notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...webhookForm}>
                <form onSubmit={webhookForm.handleSubmit(handleSaveWebhook)} className="space-y-4">
                  <FormField
                    control={webhookForm.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord Webhook URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://discord.com/api/webhooks/..."
                            {...field}
                            data-testid="input-webhook-url"
                            className="animate-fade-in"
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-muted-foreground animate-fade-in">
                          <p>How to get your Discord webhook URL:</p>
                          <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Go to your Discord server settings</li>
                            <li>Navigate to Integrations → Webhooks</li>
                            <li>Create a new webhook or edit an existing one</li>
                            <li>Copy the webhook URL and paste it here</li>
                          </ol>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      data-testid="button-save-webhook"
                      className="animate-fade-in-up animate-shimmer"
                    >
                      {isLoading ? "Saving..." : "Save Webhook URL"}
                    </Button>

                    {currentWebhookUrl && (
                      <div className="flex items-center space-x-2 animate-fade-in">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-sm text-muted-foreground">Webhook configured</span>
                      </div>
                    )}
                  </div>
                </form>
              </Form>

              {/* Test webhook functionality */}
              {currentWebhookUrl && (
                <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg animate-fade-in-left">
                  <h4 className="font-medium mb-2">Webhook Features</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Real-time IP address and location tracking</p>
                    <p>• VPN detection with original IP identification</p>
                    <p>• Device fingerprinting (browser, OS, device type)</p>
                    <p>• Security alerts for suspicious activity</p>
                    <p>• Detailed visitor analytics and timestamps</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user?.isDev && (
          <TabsContent value="dev-users" className="space-y-6">
            <Card className="animate-card animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Create New Account</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createUserForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} className="animate-fade-in"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createUserForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} className="animate-fade-in"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createUserForm.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="animate-fade-in">
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user" className="animate-fade-in">Regular User</SelectItem>
                                <SelectItem value="testing" className="animate-fade-in">Testing Account</SelectItem>
                                <SelectItem value="developer" className="animate-fade-in">Developer Account</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createUserForm.control}
                        name="isDev"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm animate-fade-in">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Developer Privileges</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Grant administrative access
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="animate-pulse-subtle animate-shimmer"
                    >
                      {isLoading ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="animate-card animate-slide-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>All Registered Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="text-center py-4 animate-pulse">Loading users...</div>
                ) : (
                  <Table className="animate-fade-in">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devUsers.map((devUser: any, index) => (
                        <TableRow key={devUser.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                          <TableCell className="font-medium">{devUser.username}</TableCell>
                          <TableCell>
                            <Badge variant={devUser.isDev ? "default" : "secondary"}>
                              {devUser.accountType || "user"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={devUser.isBanned ? "destructive" : "default"}>
                              {devUser.isBanned ? "Banned" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(devUser.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="flex space-x-2">
                            {devUser.isBanned ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnbanUser(devUser.id)}
                                className="animate-fade-in"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="animate-fade-in">
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="animate-scale-in">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ban User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <Form {...banUserForm}>
                                        <FormField
                                          control={banUserForm.control}
                                          name="reason"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Ban Reason</FormLabel>
                                              <FormControl>
                                                <Textarea
                                                  placeholder="Enter reason for ban..."
                                                  {...field}
                                                  className="animate-fade-in"
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </Form>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="animate-fade-in">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        const reason = banUserForm.getValues().reason;
                                        if (reason) {
                                          handleBanUser(devUser.id, reason);
                                        }
                                      }}
                                      className="animate-fade-in"
                                    >
                                      Ban User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {!devUser.isDev && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="animate-fade-in">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="animate-scale-in">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure? This will permanently delete the user account and all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="animate-fade-in">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(devUser.id)}
                                      className="animate-fade-in"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user?.isDev && (
          <TabsContent value="dev-keys" className="space-y-6">
            <Card className="animate-card animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Create Access Key</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...createKeyForm}>
                  <form onSubmit={createKeyForm.handleSubmit(handleCreateKey)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createKeyForm.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Key</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter access key" {...field} className="animate-fade-in"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createKeyForm.control}
                        name="usageLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usage Limit</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter usage limit" {...field} className="animate-fade-in"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="animate-pulse-subtle animate-shimmer"
                    >
                      {isLoading ? "Creating..." : "Create Access Key"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="animate-card animate-slide-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle>Your Access Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="text-center py-4 animate-pulse">Loading keys...</div>
                ) : (
                  <Table className="animate-fade-in">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devKeys.map((key: any, index) => (
                        <TableRow key={key.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                          <TableCell className="font-mono">{key.key}</TableCell>
                          <TableCell>
                            {key.usedCount} / {key.usageLimit}
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.isActive ? "default" : "secondary"}>
                              {key.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(key.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="animate-fade-in">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="animate-scale-in">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Access Key</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure? This will permanently delete the access key.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="animate-fade-in">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteKey(key.id)}
                                    className="animate-fade-in"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}