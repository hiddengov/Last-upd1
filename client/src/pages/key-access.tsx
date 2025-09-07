import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeyAccessProps {
  onAccessGranted: () => void;
}

export default function KeyAccess({ onAccessGranted }: KeyAccessProps) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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
    <div className="min-h-screen flex items-center justify-center" 
         style={{
           background: 'radial-gradient(ellipse at center, #7f1d1d 0%, #450a0a 35%, #1c1917 100%)'
         }}>
      <div className="w-full max-w-md p-6">
        <Card className="border-0 shadow-2xl" style={{ backgroundColor: 'rgba(12, 10, 9, 0.95)' }}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <Key className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              EXNL KEY SYSTEM
            </CardTitle>
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
                  placeholder="Av121988"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  data-testid="input-access-code"
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                disabled={isLoading}
                data-testid="button-verify-access"
              >
                {isLoading ? "VERIFYING..." : "VERIFY ACCESS"}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Need an access code? Contact the administrator
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>Access codes are required for security</span>
              </div>
              <p className="text-xs text-gray-500">
                Each code can only be used once unless permanent
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}