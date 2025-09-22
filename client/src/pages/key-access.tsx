import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SnowEffect from "@/components/ui/snow-effect";
import { Key, AlertTriangle, CheckCircle, Shield, Snowflake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeyAccessProps {
  onAccessGranted: () => void;
}

export default function KeyAccess({ onAccessGranted }: KeyAccessProps) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [snowColor, setSnowColor] = useState("#ffffff");
  const { toast } = useToast();

  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setError("Access code is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: accessKey.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Access Granted",
          description: "Welcome to Exnl IP Logger",
        });
        onAccessGranted();
      } else {
        setError(data.error || "Invalid access code");
      }
    } catch (error) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
         style={{
           background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #581c87 35%, #0f0f23 100%)'
         }}>
      <SnowEffect color={snowColor} glow={true} density={80} speed={0.8} />
      <div className="w-full max-w-md p-6 relative z-10">
        <Card className="border-0 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg backdrop-blur-sm">
              <Key className="text-white w-8 h-8 drop-shadow-lg" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-2xl font-bold text-white drop-shadow-lg">
                EXNL KEY SYSTEM
              </CardTitle>
              <button
                onClick={() => setSnowColor(snowColor === '#ffffff' ? '#00ffff' : '#ffffff')}
                className="text-gray-400 hover:text-white transition-colors"
                title="Change snow color"
              >
                <Snowflake className="w-5 h-5" />
              </button>
            </div>
            <CardDescription className="text-gray-300">
              Enter your one-time access code to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Secure access verification required</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300">One-time code authentication</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-900/50 border-red-500">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Internal server error
                </AlertDescription>
              </Alert>
            )}

            {/* Access Form */}
            <form onSubmit={handleVerifyAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Access Code
                </label>
                <Input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter access code"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-blue-500"
                  data-testid="input-access-code"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 shadow-lg"
                disabled={isLoading}
                data-testid="button-verify-access"
              >
                {isLoading ? "VERIFYING..." : "VERIFY ACCESS"}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center space-y-2 pt-4 border-t border-white/20">
              <p className="text-sm text-gray-300">
                Need an access code? Contact the administrator
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-yellow-300">
                <AlertTriangle className="w-3 h-3" />
                <span>Access codes are required for security</span>
              </div>
              <p className="text-xs text-gray-400">
                Each code can only be used once unless permanent
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}