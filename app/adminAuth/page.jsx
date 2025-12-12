"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function OrganizerAuthPage() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle OAuth callback redirect
  useEffect(() => {
    // const searchParams = new URLSearchParams(window.location.search);
    // const isOAuthCallback = searchParams.get("oauth") === "true";

    if (status === "authenticated" && session?.user?.role === "admin") {
      // Successfully authenticated as admin via OAuth
      toast({
        title: "Success!",
        description: "You have been logged in successfully",
      });
      router.push("/admin-dashboard");
    }
  }, [status, session, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        // Use NextAuth's signIn function for credentials authentication
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          userType: "admin", // Identify this as admin login
          redirect: false,
        });

        // Check for authentication errors
        if (result?.error) {
          toast({
            title: "Login Failed",
            description:
              result.error === "CredentialsSignin"
                ? "Invalid email or password"
                : result.error,
            variant: "destructive",
          });
        } else if (result?.ok) {
          // Login successful
          toast({
            title: "Success!",
            description: "You have been logged in successfully",
          });
          // Redirect to admin dashboard
          window.location.href = "/admin-dashboard";
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          error.message ||
          "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg max-w-2xl w-full shadow-xl"
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-3xl font-bold text-foreground">
            {mode === "login" ? "admin Sign In" : "Become an admin"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login"
              ? "Access your admin dashboard"
              : "Create events and manage your organization"}
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-10 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
              onClick={() => {
                // Set cookie to persist auth type across OAuth redirect
                document.cookie =
                  "auth_type=admin; path=/; max-age=600; SameSite=Lax"; // 10 minutes
                console.log("🍪 Cookie set: auth_type=admin");
              }}
            >
              {isLoading ? "Please wait..." : "Sign In"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
