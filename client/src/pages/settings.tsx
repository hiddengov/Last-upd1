import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Settings as SettingsIcon, Shield, Palette, Key, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SettingsData {
  webhookUrl: string | null;
  uploadedImageName: string | null;
  hasUploadedImage: boolean;
}

interface AccessKey {
  id: string;
  key: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

const settingsSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid webhook URL").optional().or(z.literal("")),
});

const createKeySchema = z.object({
  key: z.string().min(3, "Key must be at least 3 characters"),
  usageLimit: z.number().min(1, "Usage limit must be at least 1"),
});

type SettingsForm = z.infer<typeof settingsSchema>;
type CreateKeyForm = z.infer<typeof createKeySchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { themes, currentTheme, setTheme, isChangingTheme } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['/api/settings'],
  });

  // Key management queries
  const { data: keys, isLoading: keysLoading } = useQuery<AccessKey[]>({
    queryKey: ['/api/dev/keys'],
    enabled: user?.isDev,
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      webhookUrl: settings?.webhookUrl || "",
    },
  });

  const createKeyForm = useForm<CreateKeyForm>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      key: "",
      usageLimit: 10,
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings?.webhookUrl) {
      form.setValue("webhookUrl", settings.webhookUrl);
    }
  }, [settings, form]);

  const settingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          webhookUrl: data.webhookUrl || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your webhook settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Image Uploaded Successfully!", 
        description: `${data.filename} is now active. Your tracking URL is ready to use.`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/upload-image', { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete image');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Image Deleted", description: "The uploaded image has been removed." });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete image.", variant: "destructive" });
    }
  });

  // Key management mutations
  const createKeyMutation = useMutation({
    mutationFn: async (data: CreateKeyForm) => {
      const response = await fetch('/api/dev/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create key');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dev/keys'] });
      createKeyForm.reset();
      toast({
        title: "Success",
        description: "Access key created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(`/api/dev/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete key');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dev/keys'] });
      toast({
        title: "Success",
        description: "Access key deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete key",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image smaller than 10MB.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({ title: "Invalid File", description: "Please select an image or video file.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <SettingsIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
              <p className="text-muted-foreground">Configure your IP logger settings and preferences</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Security Notice */}
          <Card className="border-yellow-500/20 bg-yellow-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-yellow-600 dark:text-yellow-400">Security Testing Tool</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                This tool is for authorized security testing purposes only. Ensure you have proper authorization 
                before deploying any tracking mechanisms.
              </p>
            </CardContent>
          </Card>

          {/* Tabbed Settings Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${user?.isDev ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
              <TabsTrigger value="themes" data-testid="tab-themes">Themes</TabsTrigger>
              <TabsTrigger value="webhook" data-testid="tab-webhook">Webhook</TabsTrigger>
              {user?.isDev && (
                <TabsTrigger value="keys" data-testid="tab-keys">Key Management</TabsTrigger>
              )}
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Decoy Content Upload</CardTitle>
                  <CardDescription>
                    Upload image or video files that will be served when the tracking URL is accessed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {settings?.hasUploadedImage ? (
                      <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <Upload className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{settings.uploadedImageName}</p>
                            <p className="text-sm text-muted-foreground">
                              Active decoy content - will be displayed when tracking URL is accessed
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                          data-testid="button-delete-image"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          dragOver 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                      >
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Upload Decoy Content</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag and drop an image or video file, or click to browse
                        </p>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                          data-testid="input-file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button variant="outline" className="cursor-pointer" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Maximum file size: 10MB • Supported formats: Images, Videos
                        </p>
                      </div>
                    )}
                    
                    {uploadMutation.isPending && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Uploading file...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Themes Tab */}
            <TabsContent value="themes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Theme Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Customize the appearance of your dashboard with 15 different themes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Theme</label>
                    <Select
                      value={currentTheme.id}
                      onValueChange={setTheme}
                      disabled={isChangingTheme}
                    >
                      <SelectTrigger className="w-full" data-testid="select-theme">
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: theme.colors.primary }}
                              ></div>
                              <span>{theme.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      Theme changes are saved automatically and persist across sessions
                    </p>
                  </div>
                  
                  {isChangingTheme && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Applying theme...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhook Tab */}
            <TabsContent value="webhook" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Link className="h-5 w-5" />
                    <span>Discord Webhook Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure Discord webhook to receive IP logging notifications in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => settingsMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="webhookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Webhook URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://discord.com/api/webhooks/..."
                                data-testid="input-webhook-url"
                              />
                            </FormControl>
                            <FormDescription>
                              Discord webhook URL to receive IP access notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-3">
                        <Button 
                          type="submit" 
                          disabled={settingsMutation.isPending}
                          data-testid="button-save-settings"
                        >
                          {settingsMutation.isPending ? "Saving..." : "Save Settings"}
                        </Button>
                        
                        {settings?.webhookUrl && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Webhook Active
                          </Badge>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Key Management Tab */}
            {user?.isDev && (
              <TabsContent value="keys" className="space-y-4">
                {/* Create New Key */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Plus className="h-5 w-5" />
                      <span>Create New Access Key</span>
                    </CardTitle>
                    <CardDescription>
                      Generate new access keys with custom usage limits for the Exnl Key System
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...createKeyForm}>
                      <form 
                        onSubmit={createKeyForm.handleSubmit((data) => createKeyMutation.mutate(data))} 
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={createKeyForm.control}
                            name="key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Access Key</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter key name (e.g., demo123)"
                                    data-testid="input-key-name"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Unique identifier for the access key
                                </FormDescription>
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
                                  <Input
                                    {...field}
                                    type="number"
                                    min={1}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    data-testid="input-usage-limit"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum number of times this key can be used
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={createKeyMutation.isPending}
                          data-testid="button-create-key"
                        >
                          {createKeyMutation.isPending ? "Creating..." : "Create Key"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Existing Keys List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Key className="h-5 w-5" />
                      <span>Active Access Keys</span>
                    </CardTitle>
                    <CardDescription>
                      Manage and monitor existing access keys
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {keysLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse bg-muted rounded h-16"></div>
                        ))}
                      </div>
                    ) : !keys || keys.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No access keys created yet</p>
                        <p className="text-sm">Create your first key above to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {keys.map((key) => (
                          <div
                            key={key.id}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Key className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{key.key}</p>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>Uses: {key.usedCount}/{key.usageLimit}</span>
                                  <span>•</span>
                                  <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <Badge 
                                    variant={key.isActive && key.usedCount < key.usageLimit ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {key.isActive && key.usedCount < key.usageLimit ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteKeyMutation.mutate(key.id)}
                              disabled={deleteKeyMutation.isPending}
                              data-testid={`button-delete-key-${key.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}