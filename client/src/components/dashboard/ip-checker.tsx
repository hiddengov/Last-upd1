import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  MapPin, 
  Shield, 
  ShieldAlert, 
  Clock, 
  Search,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useState } from "react";
import { Search, Copy, CheckCircle, ShieldAlert, Globe, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface IPInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  hosting: boolean;
}

export default function IPChecker() {
  const [ipAddress, setIpAddress] = useState('');
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const validateIP = (ip: string) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const checkIP = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter an IP address');
      return;
    }

    if (!validateIP(ipAddress.trim())) {
      setError('Please enter a valid IP address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress.trim()}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,org,as,proxy,hosting`);
      const data = await response.json();

      if (data.status === 'fail') {
        setError(data.message || 'Failed to lookup IP address');
        setIpInfo(null);
      } else {
        setIpInfo({
          ip: ipAddress.trim(),
          country: data.country || 'Unknown',
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
          lat: data.lat || 0,
          lon: data.lon || 0,
          timezone: data.timezone || 'Unknown',
          isp: data.isp || 'Unknown',
          org: data.org || 'Unknown',
          as: data.as || 'Unknown',
          vpn: data.proxy || false,
          proxy: data.proxy || false,
          tor: false,
          hosting: data.hosting || false
        });
      }
    } catch (err) {
      setError('Failed to connect to IP lookup service');
      setIpInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "IP information copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          IP Address Checker
        </CardTitle>
        <CardDescription>
          Enter an IP address to get detailed information about its location and network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkIP()}
          />
          <Button onClick={checkIP} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Check IP'}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}

        {ipInfo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">IP Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(ipInfo, null, 2))}
                className="flex items-center gap-2"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">IP Address:</span>
                  <span className="font-mono">{ipInfo.ip}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Location:</span>
                  <span>{ipInfo.city}, {ipInfo.region}, {ipInfo.country}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Timezone:</span>
                  <span>{ipInfo.timezone}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-medium">ISP:</span>
                  <p className="text-sm text-muted-foreground">{ipInfo.isp}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-medium">Organization:</span>
                  <p className="text-sm text-muted-foreground">{ipInfo.org}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="font-medium">Coordinates:</span>
                  <p className="text-sm font-mono">{ipInfo.lat}, {ipInfo.lon}</p>
                </div>

                <div className="space-y-2">
                  <span className="font-medium">Security Flags:</span>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">VPN</span>
                      {ipInfo.vpn ? (
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Proxy</span>
                      {ipInfo.proxy ? (
                        <ShieldAlert className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Hosting</span>
                      {ipInfo.hosting ? (
                        <ShieldAlert className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

  const checkIP = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter an IP address');
      return;
    }

    if (!validateIP(ipAddress.trim())) {
      setError('Please enter a valid IP address');
      return;
    }

    setIsLoading(true);
    setError('');
    setIpInfo(null);

    try {
      // Using ipwhois.app which is free, HTTPS, and doesn't require API key
      const response = await fetch(`https://ipwhois.app/json/${ipAddress.trim()}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to get IP information');
        return;
      }

      // Transform the response to our interface
      const transformedData: IPInfo = {
        ip: data.ip || ipAddress.trim(),
        country: data.country || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        lat: data.latitude || 0,
        lon: data.longitude || 0,
        timezone: data.timezone || 'Unknown',
        isp: data.isp || 'Unknown',
        org: data.org || 'Unknown',
        as: data.asn || 'Unknown',
        vpn: data.type === 'VPN' || data.type === 'Proxy' || false,
        proxy: data.type === 'Proxy' || false,
        tor: data.type === 'Tor' || false,
        hosting: data.type === 'Hosting' || data.type === 'Data Center' || false
      };

      setIpInfo(transformedData);
      toast({
        title: 'IP Information Retrieved',
        description: `Successfully looked up ${ipAddress}`,
      });
    } catch (err) {
      setError('Failed to fetch IP information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'IP address copied to clipboard',
    });
  };

  const getThreatLevel = (info: IPInfo) => {
    if (info.vpn || info.proxy || info.tor) return 'high';
    if (info.hosting) return 'medium';
    return 'low';
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-up">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            IP Address Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-500/50"
              data-testid="input-ip-address"
              onKeyPress={(e) => e.key === 'Enter' && checkIP()}
            />
            <Button 
              onClick={checkIP}
              disabled={isLoading}
              className="bg-blue-600/80 hover:bg-blue-700/80 text-white backdrop-blur-sm"
              data-testid="button-check-ip"
            >
              {isLoading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <Alert className="bg-red-900/50 border-red-500/50 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {ipInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-left">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-400" />
                  Location Details
                </span>
                <Button
                  onClick={() => copyToClipboard(ipInfo.ip)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">IP Address</label>
                  <p className="text-white font-mono text-lg">{ipInfo.ip}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Country</label>
                  <p className="text-white">{ipInfo.country}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Region/State</label>
                  <p className="text-white">{ipInfo.region}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">City</label>
                  <p className="text-white">{ipInfo.city}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Timezone</label>
                  <p className="text-white">{ipInfo.timezone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Coordinates</label>
                  <p className="text-white text-sm">{ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Security Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Threat Level</label>
                  <Badge className={`mt-1 ${getThreatColor(getThreatLevel(ipInfo))}`}>
                    {getThreatLevel(ipInfo).toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm text-gray-300">VPN</span>
                    {ipInfo.vpn ? (
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm text-gray-300">Proxy</span>
                    {ipInfo.proxy ? (
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm text-gray-300">Tor</span>
                    {ipInfo.tor ? (
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm text-gray-300">Hosting</span>
                    {ipInfo.hosting ? (
                      <ShieldAlert className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">ISP</label>
                  <p className="text-white">{ipInfo.isp}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Organization</label>
                  <p className="text-white text-sm">{ipInfo.org}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">ASN</label>
                  <p className="text-white text-sm">{ipInfo.as}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}