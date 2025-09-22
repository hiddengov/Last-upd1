import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SnowEffect from "@/components/ui/snow-effect";
import { Shield, User, Lock, AlertTriangle, Eye, EyeOff, Snowflake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { snowColor, setSnowColor } = useTheme();
  const { toast } = useToast();

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      setError("Username and password are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.username}`,
        });
        onLogin(data.token, data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password) {
      setError("Username and password are required");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Account created!",
          description: "You can now log in with your new account",
        });
        // Reset form and switch to login tab
        setRegisterData({ username: "", password: "", confirmPassword: "" });
        setLoginData({ username: registerData.username, password: "" });
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <SnowEffect color={snowColor} glow={true} density={80} speed={0.8} />
      <div className="w-full max-w-md p-6 relative z-10">
        <Card className="border-0 shadow-2xl animate-card animate-slide-in-up backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', animationDelay: '200ms' }}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg backdrop-blur-sm">
              <Shield className="text-white w-8 h-8 drop-shadow-lg" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-2xl font-bold text-white animate-fade-in-down drop-shadow-lg">
                EXNL IP LOGGER
              </CardTitle>
              <button
                onClick={() => setSnowColor(snowColor === '#ffffff' ? '#00ffff' : '#ffffff')}
                className="text-gray-400 hover:text-white transition-colors"
                title="Change snow color"
              >
                <Snowflake className="w-5 h-5" />
              </button>
            </div>
            <CardDescription className="text-gray-300 animate-fade-in-down" style={{ animationDelay: '100ms' }}>
              Secure access to your IP tracking dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="bg-red-900/50 border-red-500 mb-6 animate-shake">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 backdrop-blur-md border border-white/20 animate-slide-in-right">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-gray-300 transition-colors duration-300 backdrop-blur-sm"
                  data-testid="tab-login"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-gray-300 transition-colors duration-300 backdrop-blur-sm"
                  data-testid="tab-register"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <Input
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      placeholder="Enter your username"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-blue-500 transition-colors duration-300"
                      data-testid="input-login-username"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        placeholder="Enter your password"
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-blue-500 pr-10 transition-colors duration-300"
                        data-testid="input-login-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 focus:ring-blue-500 focus:ring-opacity-50 animate-pulse-subtle animate-shimmer shadow-lg"
                    data-testid="button-login"
                  >
                    {isLoading ? "LOGGING IN..." : "LOGIN"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <Input
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      placeholder="Choose a username"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-blue-500 transition-colors duration-300"
                      data-testid="input-register-username"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        placeholder="Create a password"
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-blue-500 pr-10 transition-colors duration-300"
                        data-testid="input-register-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Confirm Password
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      placeholder="Confirm your password"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-blue-500 transition-colors duration-300"
                      data-testid="input-register-confirm-password"
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 focus:ring-blue-500 focus:ring-opacity-50 animate-pulse-subtle animate-shimmer shadow-lg"
                    data-testid="button-register"
                  >
                    {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}