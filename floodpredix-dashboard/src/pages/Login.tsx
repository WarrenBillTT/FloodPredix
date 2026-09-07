import { useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import logoImage from "@/assets/FloodPredix_TRANS.png";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Decode JWT to extract user info
      const parts = credentialResponse.credential.split(".");
      let email = "";
      let name = "";
      let picture = "";

      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          email = payload.email || "";
          name = payload.name || "";
          picture = payload.picture || "";
        } catch {
          console.warn("Could not decode JWT payload");
        }
      }

      const response = await api.googleLogin(
        credentialResponse.credential,
        email,
        name,
        picture
      );

      if (response.success && response.data) {
        const { user, token } = response.data;
        login(
          {
            ...user,
            avatar: user.avatar || undefined,
          },
          token
        );
        navigate("/dashboard");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(
        "Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file."
      );
    } else {
      setError(
        "Google login failed. Please ensure your origin is added to the Google OAuth client configuration in Google Cloud Console."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#112117] to-[#0a1410] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between border-b border-[#254632] backdrop-blur-sm bg-[rgba(17,33,23,0.8)]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center">
            <img
              src={logoImage}
              alt="FloodPredix Logo"
              className="h-ful mt-1 w-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-white">FloodPredix</h1>
        </div>
        <a
          href="#"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Contact Support
        </a>
      </header>

      {/* Main Content */}
      <Card className="w-full max-w-4xl bg-[#1a2c23] border-[#254632] shadow-2xl">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Marketing */}
          <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#1a2c23] to-[#0d1811] relative overflow-hidden rounded-l-lg">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-30 mix-blend-overlay" />
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mb-6">
                <img
                  src={logoImage}
                  alt="FloodPredix Logo"
                  className="h-ful mt-1 w-full object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Real-time flood monitoring
                <br />
                for safer communities.
              </h2>
              <p className="text-muted-foreground mb-8">
                Access live sensor data, predictive analytics, and emergency
                alert systems directly from your dashboard.
              </p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-[#1a2c23] bg-gradient-to-br from-primary/20 to-primary/10"
                    />
                  ))}
                </div>
                <span className="text-sm text-primary">
                  Trusted by 50+ Municipalities
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-10">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl text-white">
                Welcome Back
              </CardTitle>
              <CardDescription>
                Sign in to access your monitoring dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded">
                  {error}
                </div>
              )}
              {!loading && (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                />
              )}
              {loading && (
                <div className="p-4 text-center text-muted-foreground">
                  Logging in...
                </div>
              )}

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-[#1a2c23] px-4 text-xs text-muted-foreground uppercase tracking-wider">
                    Secure Access
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full text-white hover:text-gray-500 border-[#254632] bg-transparent hover:bg-[#254632]"
              >
                <Lock className="mr-2 h-4 w-4" />
                Sign in with SSO
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to FloodPredix's{" "}
                <a href="#" className="underline hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#254632] bg-[#112117] text-center text-sm text-muted-foreground">
        © 2025 FloodPredix. All rights reserved.
      </footer>
    </div>
  );
}
