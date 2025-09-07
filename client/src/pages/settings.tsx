import { useEffect } from "react";
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
import { Upload, Link, Settings as SettingsIcon, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SettingsData {
  webhookUrl: string | null;
  uploadedImageName: string | null;
  hasUploadedImage: boolean;
}

const settingsSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid webhook URL").optional().or(z.literal("")),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['/api/settings'],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      webhookUrl: settings?.webhookUrl || "",
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: data.webhookUrl || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings Updated", description: "Your webhook settings have been saved." });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
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
      const response = await fetch('/api/upload-image', { method: 'DELETE' });
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
              <p className="text-muted-foreground">Configure webhook and decoy content settings for your IP logger</p>
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

          {/* Webhook Configuration */}
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
                      data-testid="button-save-webhook"
                    >
                      {settingsMutation.isPending ? "Saving..." : "Save Webhook"}
                    </Button>

                    {settings?.webhookUrl && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Webhook Configured
                      </Badge>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Image Configuration Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Image Configuration</span>
              </CardTitle>
              <CardDescription>
                Manage your decoy images and generate tracking links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Upload & Configure Images</p>
                    <p className="text-sm text-muted-foreground">
                      {settings?.hasUploadedImage 
                        ? `Current: ${settings.uploadedImageName}` 
                        : "Using default 1x1 pixel"}
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <a href="/image-config" data-testid="button-manage-images">
                    Manage Images
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Instructions</CardTitle>
              <CardDescription>
                How to use your IP logger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Share the Logger URL</p>
                  <p className="text-sm text-muted-foreground">
                    Send this URL to targets: <code className="bg-muted px-2 py-1 rounded text-xs">
                      {window.location.origin}/track/{settings?.uploadedImageName || 'default'}
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Monitor Activity</p>
                  <p className="text-sm text-muted-foreground">
                    View IP logs in the dashboard and receive Discord notifications
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Export collected data as CSV for analysis and reporting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}