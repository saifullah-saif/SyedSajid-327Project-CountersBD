"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

import {
  User,
  Building2,
  Mail,
  Lock,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Upload,
  Eye,
  EyeOff,
  Save,
  FileText,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("organization");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoImage, setLogoImage] = useState(null);
  const [logoImagePreview, setLogoImagePreview] = useState(null);
  const [organizerStats, setOrganizerStats] = useState({
    totalEvents: 0,
    ticketsSold: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  // Form state for organization profile
  const [organizationData, setOrganizationData] = useState({
    organizationName: "",
    email: "",
    phoneNumber: "",
    description: "",
    website: "",
    facebookLink: "",
    instaLink: "",
    logo: "",
  });

  // Form state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data and stats when component mounts
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    loadOrganizerProfile();
    loadOrganizerStats();
  }, [user, router]);

  const loadOrganizerProfile = async () => {
    try {
      const result = await settings.getProfile();
      if (result.success) {
        const profile = result.data;
        setOrganizationData({
          organizationName: profile.organization_name || "",
          email: profile.email || "",
          phoneNumber: profile.phone_number || "",
          description: profile.description || "",
          website: profile.web_link || "",
          facebookLink: profile.facebook_link || "",
          instaLink: profile.insta_link || "",
          logo: profile.logo || "",
        });
        setLogoImagePreview(profile.logo || null);
      }
    } catch (error) {
      console.error("Failed to load organizer profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const loadOrganizerStats = async () => {
    try {
      const result = await settings.getStats();
      if (result.success) {
        setOrganizerStats(result.data);
      }
    } catch (error) {
      console.error("Failed to load organizer stats:", error);
      // Stats are not critical, so we don't show an error toast
    }
  };

  const handleOrganizationChange = (e) => {
    const { name, value } = e.target;
    setOrganizationData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }

      setLogoImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrganizationSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!organizationData.organizationName.trim()) {
        toast({
          title: "Validation Error",
          description: "Organization name is required.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Upload logo if a new one was selected
      if (logoImage) {
        try {
          const logoResult = await settings.uploadLogo(
            logoImage
          );
          if (logoResult.success) {
            setLogoImagePreview(logoResult.data.logo);
            setOrganizationData((prev) => ({
              ...prev,
              logo: logoResult.data.logo,
            }));
          }
        } catch (logoError) {
          console.error("Logo upload failed:", logoError);
          toast({
            title: "Logo Upload Failed",
            description:
              "Failed to upload logo, but profile will be updated without it.",
            variant: "destructive",
          });
        }
      }

      // Update profile data
      const organizerProfileData = {
        organization_name: organizationData.organizationName,
        email: organizationData.email,
        phone_number: organizationData.phoneNumber,
        description: organizationData.description,
        web_link: organizationData.website,
        facebook_link: organizationData.facebookLink,
        insta_link: organizationData.instaLink,
      };

      const result = await settings.updateProfile(
        organizerProfileData
      );

      if (result.success) {
        toast({
          title: "Profile Updated",
          description:
            "Your organization profile has been updated successfully.",
          variant: "success",
        });

        // Clear the logo image state since it's been uploaded
        setLogoImage(null);

        // Reload profile to get updated data
        await loadOrganizerProfile();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Organization profile update error:", error);
      toast({
        title: "Update Failed",
        description:
          error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Note: Password change functionality would need to be implemented in authAPI
      // For now, we'll show a placeholder message
      toast({
        title: "Feature Coming Soon",
        description: "Password change functionality will be available soon.",
        variant: "destructive",
      });

      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "Password update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h1 className="text-4xl font-bold mb-4 md:mb-0">
            Organization Settings
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-lg p-6 sticky top-24">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-accent rounded-full overflow-hidden mb-4">
                  <img
                    src={
                      logoImagePreview || "/placeholder.svg?height=96&width=96"
                    }
                    alt={organizationData.organizationName || "Organization"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-lg font-bold text-center">
                  {organizationData.organizationName || "Organization Name"}
                </h2>
                <p className="text-sm text-zinc-400">
                  {organizationData.email}
                </p>
              </div>

              <nav className="space-y-1">
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "organization"
                      ? "bg-accent text-white"
                      : "text-zinc-400 hover:bg-accent"
                  }`}
                  onClick={() => setActiveTab("organization")}
                >
                  Organization Profile
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "security"
                      ? "bg-accent text-white"
                      : "text-zinc-400 hover:bg-accent"
                  }`}
                  onClick={() => setActiveTab("security")}
                >
                  Security
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "social"
                      ? "bg-accent text-white"
                      : "text-zinc-400 hover:bg-accent"
                  }`}
                  onClick={() => setActiveTab("social")}
                >
                  Social Media Links
                </button>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900 rounded-lg p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="organization">
                  <h2 className="text-xl font-bold mb-6">
                    Organization Profile
                  </h2>
                  <form onSubmit={handleOrganizationSave}>
                    <div className="space-y-6">
                      {/* Organization Logo */}
                      <div>
                        <Label className="text-sm text-zinc-400 mb-2 block">
                          Organization Logo
                        </Label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-accent rounded-full overflow-hidden">
                            <img
                              src={
                                logoImagePreview ||
                                "/placeholder.svg?height=80&width=80"
                              }
                              alt="Organization Logo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="organization-logo"
                              className="bg-accent hover:bg-zinc-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-flex items-center"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </Label>
                            <Input
                              id="organization-logo"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoChange}
                            />
                            <p className="text-xs text-zinc-400 mt-2">
                              Recommended: Square JPG or PNG, at least 300x300px
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-accent" />

                      {/* Organization Name & Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="organizationName"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Organization Name *
                          </Label>
                          <div className="relative">
                            <Building2
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                              size={18}
                            />
                            <Input
                              id="organizationName"
                              name="organizationName"
                              value={organizationData.organizationName}
                              onChange={handleOrganizationChange}
                              className="bg-accent border-zinc-700 pl-10"
                              placeholder="Your Organization Name"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label
                            htmlFor="email"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Email Address *
                          </Label>
                          <div className="relative">
                            <Mail
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                              size={18}
                            />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={organizationData.email}
                              onChange={handleOrganizationChange}
                              className="bg-accent border-zinc-700 pl-10"
                              placeholder="contact@organization.com"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <Label
                          htmlFor="phoneNumber"
                          className="text-sm text-zinc-400 mb-2 block"
                        >
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                            size={18}
                          />
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={organizationData.phoneNumber}
                            onChange={handleOrganizationChange}
                            className="bg-accent border-zinc-700 pl-10"
                            placeholder="+880 **********"
                          />
                        </div>
                      </div>

                      {/* Website */}
                      <div>
                        <Label
                          htmlFor="website"
                          className="text-sm text-zinc-400 mb-2 block"
                        >
                          Website
                        </Label>
                        <div className="relative">
                          <Globe
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                            size={18}
                          />
                          <Input
                            id="website"
                            name="website"
                            type="url"
                            value={organizationData.website}
                            onChange={handleOrganizationChange}
                            className="bg-accent border-zinc-700 pl-10"
                            placeholder="https://yourorganization.com"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <Label
                          htmlFor="description"
                          className="text-sm text-zinc-400 mb-2 block"
                        >
                          Organization Description
                        </Label>
                        <div className="relative">
                          <FileText
                            className="absolute left-3 top-3 text-zinc-400"
                            size={18}
                          />
                          <Textarea
                            id="description"
                            name="description"
                            value={organizationData.description}
                            onChange={handleOrganizationChange}
                            placeholder="Tell us about your organization, mission, and what events you specialize in..."
                            rows={4}
                            className="bg-accent border-zinc-700 pl-10"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="bg-primary hover:bg-red-700"
                        disabled={isLoading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Organization Profile"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="security">
                  <h2 className="text-xl font-bold mb-6">Security</h2>
                  <form onSubmit={handlePasswordSave}>
                    <div className="space-y-6">
                      {/* Current Password */}
                      <div>
                        <Label
                          htmlFor="currentPassword"
                          className="text-sm text-zinc-400 mb-2 block"
                        >
                          Current Password *
                        </Label>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                            size={18}
                          />
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="bg-accent border-zinc-700 pl-10 pr-10"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                          >
                            {showCurrentPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password & Confirm Password */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="newPassword"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            New Password *
                          </Label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                              size={18}
                            />
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="bg-accent border-zinc-700 pl-10 pr-10"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Password must be at least 8 characters and include a
                            number and a special character.
                          </p>
                        </div>
                        <div>
                          <Label
                            htmlFor="confirmPassword"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Confirm New Password *
                          </Label>
                          <div className="relative">
                            <Lock
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                              size={18}
                            />
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className="bg-accent border-zinc-700 pl-10 pr-10"
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-accent rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                          Password Requirements:
                        </h4>
                        <ul className="text-sm text-zinc-400 space-y-1">
                          <li>• At least 8 characters long</li>
                          <li>• Include uppercase and lowercase letters</li>
                          <li>• Include at least one number</li>
                          <li>• Include at least one special character</li>
                        </ul>
                      </div>

                      <Button
                        type="submit"
                        className="bg-primary hover:bg-red-700"
                        disabled={isLoading}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="social">
                  <h2 className="text-xl font-bold mb-6">Social Media Links</h2>
                  <form onSubmit={handleOrganizationSave}>
                    <div className="space-y-6">
                      {/* Facebook Link */}
                      <div>
                        <Label
                          htmlFor="facebookLink"
                          className="text-sm text-zinc-400 mb-2 block"
                        >
                          Facebook Page
                        </Label>
                        <div className="relative">
                          <Facebook
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                            size={18}
                          />
                          <Input
                            id="facebookLink"
                            name="facebookLink"
                            type="url"
                            value={organizationData.facebookLink}
                            onChange={handleOrganizationChange}
                            className="bg-accent border-zinc-700 pl-10"
                            placeholder="https://facebook.com/yourorganization"
                          />
                        </div>
                      </div>

                      {/* Instagram Link */}
                      <div>
                        <Label
                          htmlFor="instaLink"
                          className="text-sm text-zinc-400 mb-2 block"
                        >
                          Instagram Account
                        </Label>
                        <div className="relative">
                          <Instagram
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                            size={18}
                          />
                          <Input
                            id="instaLink"
                            name="instaLink"
                            type="url"
                            value={organizationData.instaLink}
                            onChange={handleOrganizationChange}
                            className="bg-accent border-zinc-700 pl-10"
                            placeholder="https://instagram.com/yourorganization"
                          />
                        </div>
                      </div>

                      <div className="bg-accent rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                          Social Media Benefits:
                        </h4>
                        <ul className="text-sm text-zinc-400 space-y-1">
                          <li>• Increase event visibility and reach</li>
                          <li>• Build trust with potential attendees</li>
                          <li>
                            • Share event updates and behind-the-scenes content
                          </li>
                          <li>• Connect with your community</li>
                        </ul>
                      </div>

                      <Button
                        type="submit"
                        className="bg-primary hover:bg-red-700"
                        disabled={isLoading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Social Media Links"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Organization Statistics */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Organization Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {organizerStats.totalEvents}
              </div>
              <div className="text-sm text-zinc-400">Events Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {organizerStats.ticketsSold.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">Tickets Sold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                ${organizerStats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {organizerStats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-zinc-400">Average Rating</div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
