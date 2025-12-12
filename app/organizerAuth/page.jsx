"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Globe,
  Facebook,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function OrganizerAuthPage() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    phone: "",
    description: "",
    facebookLink: "",
    instaLink: "",
    webLink: "",
  });

  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle OAuth callback redirect
  useEffect(() => {
      // const searchParams = new URLSearchParams(window.location.search);
      // const isOAuthCallback = searchParams.get("oauth") === "true";
      
      if (status === "authenticated" && session?.user?.role === "organizer") {
        // Successfully authenticated as organizer via OAuth
        toast({
          title: "Success!",
          description: "You have been logged in successfully",
        });
        router.push("/organizer-dashboard");
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
          userType: "organizer", // Identify this as organizer login
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
          // Redirect to organizer dashboard
          window.location.href = "/organizer-dashboard";
        }
      } else {
        // Registration
        const response = await axios.post("/api/register", {
          email: formData.email,
          password: formData.password,
          organizationName: formData.organizationName,
          phoneNumber: formData.phone,
          description: formData.description,
          facebookLink: formData.facebookLink,
          instaLink: formData.instaLink,
          webLink: formData.webLink,
          userType: "organizer", // Identify this as organizer registration
        });

        if (response.data.success) {
          toast({
            title: "Success!",
            description:
              "Organizer account created successfully. Please sign in.",
          });
          // Switch to login mode
          setMode("login");
        } else {
          toast({
            title: "Registration Failed",
            description:
              response.data.error || "An error occurred during registration.",
            variant: "destructive",
          });
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
            {mode === "login" ? "Organizer Sign In" : "Become an Organizer"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login"
              ? "Access your organizer dashboard"
              : "Create events and manage your organization"}
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      placeholder="Your Organization Name"
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell us about your organization"
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                    rows={3}
                  />
                </div>
              </>
            )}

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

            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(123) 456-7890"
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm text-muted-foreground">
                    Social Links (Optional)
                  </label>

                  <div className="relative">
                    <Globe
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="url"
                      name="webLink"
                      value={formData.webLink}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="relative">
                    <Facebook
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="url"
                      name="facebookLink"
                      value={formData.facebookLink}
                      onChange={handleChange}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="relative">
                    <Instagram
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="url"
                      name="instaLink"
                      value={formData.instaLink}
                      onChange={handleChange}
                      placeholder="https://instagram.com/yourprofile"
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </>
            )}

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
            >
              {isLoading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Organizer Account"}
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-border absolute w-full"></div>
            <span className="bg-card px-2 text-sm text-muted-foreground relative">
              or continue with
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              // Set cookie to persist auth type across OAuth redirect
              document.cookie =
                "auth_type=organizer; path=/; max-age=600; SameSite=Lax"; // 10 minutes
              console.log("🍪 Cookie set: auth_type=organizer");
              signIn("google", {
                callbackUrl: "/organizerAuth?oauth=success",
                redirect: true,
              });
            }}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Sign in with Google
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Don't have an organizer account?"
                : "Already have an account?"}
              <button
                className="text-primary hover:underline ml-1"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {mode === "register" && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Your organizer account will be subject to
                approval. You'll be notified once your account is reviewed.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
