"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import CartModal from "@/components/cart-modal";
import { useCart } from "@/context/cart-context";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  Upload,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "axios";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { isCartOpen } = useCart();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    dateOfBirth: "",

    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Load user data when component mounts
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchUserProfile();
  }, [user, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("/api/user/profile");

      if (response.data.success) {
        const profile = response.data.data;

        setFormData({
          ...formData,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: profile.email || "",
          dateOfBirth: profile.dob
            ? new Date(profile.dob).toISOString().split("T")[0]
            : "",

          phone: profile.phone_number || "",
        });

        setProfileImagePreview(profile.profile_image || null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      // Handle nested objects (address fields)
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const profileData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        dob: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : null,

        phone_number: formData.phone,
        profile_image: profileImagePreview,
      };

      const response = await axios.put("/api/user/profile", profileData);

      if (response.data.success) {
        toast({
          title: "Profile updated",
          description:
            "Your personal information has been updated successfully.",
          variant: "success",
        });

        // Navigate to dashboard after successful update
        router.push("/user-dashboard");
      } else {
        toast({
          title: "Update failed",
          description: response.data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description:
          error.response?.data?.message ||
          "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.put("/api/user/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
          variant: "success",
        });

        // Navigate to dashboard after successful update
        router.push("/user-dashboard");
      } else {
        toast({
          title: "Password update failed",
          description: response.data.message || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "Password update failed",
        description:
          error.response?.data?.message ||
          "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactInfoSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const profileData = {
        phone_number: formData.phone,
        // Address fields would be included here if they existed in the database
        // For now, we'll just update the phone number
      };

      const response = await axios.put("/api/user/profile", profileData);

      if (response.data.success) {
        toast({
          title: "Contact information updated",
          description:
            "Your contact information has been updated successfully.",
          variant: "success",
        });

        // Navigate to dashboard after successful update
        router.push("/user-dashboard");
      } else {
        toast({
          title: "Update failed",
          description:
            response.data.message || "Failed to update contact information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Contact info update error:", error);
      toast({
        title: "Update failed",
        description:
          error.response?.data?.message ||
          "An unexpected error occurred. Please try again.",
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
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-20 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row items-start  md:items-center">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="mr"
                onClick={() => router.push("/user-dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
              <h1 className="text-4xl font-bold md:mb-0">Edit Profile</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 rounded-lg p-6 sticky top-24">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-accent rounded-full overflow-hidden mb-4">
                    <img
                      src={
                        profileImagePreview ||
                        `/placeholder.svg?height=96&width=96`
                      }
                      alt={`${user.profile?.first_name || ""} ${
                        user.profile?.last_name || ""
                      }`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-lg font-bold">
                    {user.name ? user.name : user.email}
                  </h2>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                </div>

                <nav className="space-y-1">
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "personal"
                        ? "bg-accent text-white"
                        : "text-zinc-400 hover:bg-accent"
                    }`}
                    onClick={() => setActiveTab("personal")}
                  >
                    Personal Information
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
                      activeTab === "contact"
                        ? "bg-accent text-white"
                        : "text-zinc-400 hover:bg-accent"
                    }`}
                    onClick={() => setActiveTab("contact")}
                  >
                    Contact Information
                  </button>
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              <div className="bg-zinc-900 rounded-lg p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="personal">
                    <h2 className="text-xl font-bold mb-6">
                      Personal Information
                    </h2>
                    <form onSubmit={handlePersonalInfoSubmit}>
                      <div className="space-y-6">
                        {/* Profile Photo */}
                        <div>
                          <Label className="text-sm text-zinc-400 mb-2 block">
                            Profile Photo
                          </Label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-accent rounded-full overflow-hidden">
                              <img
                                src={
                                  profileImagePreview ||
                                  `/placeholder.svg?height=80&width=80`
                                }
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="profile-photo"
                                className="bg-accent hover:bg-zinc-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-flex items-center"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photo
                              </Label>
                              <Input
                                id="profile-photo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                              />
                              <p className="text-xs text-zinc-400 mt-2">
                                Recommended: Square JPG or PNG, at least
                                300x300px
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-accent" />

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="firstName"
                              className="text-sm text-zinc-400 mb-2 block"
                            >
                              First Name
                            </Label>
                            <div className="relative">
                              <User
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                                size={18}
                              />
                              <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="bg-accent border-zinc-700 pl-10"
                                placeholder="John"
                              />
                            </div>
                          </div>
                          <div>
                            <Label
                              htmlFor="lastName"
                              className="text-sm text-zinc-400 mb-2 block"
                            >
                              Last Name
                            </Label>
                            <div className="relative">
                              <User
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                                size={18}
                              />
                              <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="bg-accent border-zinc-700 pl-10"
                                placeholder="Doe"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <Label
                            htmlFor="email"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Email Address
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
                              value={formData.email}
                              onChange={handleChange}
                              className="bg-accent border-zinc-700 pl-10"
                              placeholder="john.doe@example.com"
                            />
                          </div>
                        </div>

                        {/* Date of Birth & Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-1 ">
                          <Label
                            htmlFor="dateOfBirth"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Date of Birth
                          </Label>
                          <div className="relative">
                            <Calendar
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                              size={18}
                            />
                            <Input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={handleChange}
                              className="bg-accent border-zinc-700 pl-10"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="bg-primary hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="security">
                    <h2 className="text-xl font-bold mb-6">Security</h2>
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="space-y-6">
                        {/* Current Password */}
                        <div>
                          <Label
                            htmlFor="currentPassword"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Current Password
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
                              value={formData.currentPassword}
                              onChange={handleChange}
                              className="bg-accent border-zinc-700 pl-10 pr-10"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
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

                        {/* New Password */}
                        <div>
                          <Label
                            htmlFor="newPassword"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            New Password
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
                              value={formData.newPassword}
                              onChange={handleChange}
                              className="bg-accent border-zinc-700 pl-10 pr-10"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
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

                        {/* Confirm Password */}
                        <div>
                          <Label
                            htmlFor="confirmPassword"
                            className="text-sm text-zinc-400 mb-2 block"
                          >
                            Confirm New Password
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
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className="bg-accent border-zinc-700 pl-10 pr-10"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
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

                        <Button
                          type="submit"
                          className="bg-primary hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="contact">
                    <h2 className="text-xl font-bold mb-6">
                      Contact Information
                    </h2>
                    <form onSubmit={handleContactInfoSubmit}>
                      <div className="space-y-6">
                        {/* Phone Number */}
                        <div>
                          <Label
                            htmlFor="phone"
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
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleChange}
                              className="bg-accent border-zinc-700 pl-10"
                              placeholder="+880 **********"
                            />
                          </div>
                        </div>

                        <Separator className="bg-accent" />

                        {/* Address */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Address</h3>

                          {/* Street Address */}
                          <div className="mb-4">
                            <Label
                              htmlFor="street"
                              className="text-sm text-zinc-400 mb-2 block"
                            >
                              Street Address
                            </Label>
                            <div className="relative">
                              <MapPin
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                                size={18}
                              />
                              <Input
                                id="street"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                                className="bg-accent border-zinc-700 pl-10"
                                placeholder="12/A"
                              />
                            </div>
                          </div>

                          {/* City and State */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label
                                htmlFor="city"
                                className="text-sm text-zinc-400 mb-2 block"
                              >
                                City
                              </Label>
                              <Input
                                id="city"
                                name="address.city"
                                value={formData.address.city}
                                onChange={handleChange}
                                className="bg-accent border-zinc-700"
                                placeholder="Dhaka"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="state"
                                className="text-sm text-zinc-400 mb-2 block"
                              >
                                Area
                              </Label>
                              <Input
                                id="state"
                                name="address.state"
                                value={formData.address.state}
                                onChange={handleChange}
                                className="bg-accent border-zinc-700"
                                placeholder="Dhanmondi"
                              />
                            </div>
                          </div>

                          {/* Zip Code and Country */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="zipCode"
                                className="text-sm text-zinc-400 mb-2 block"
                              >
                                Zip / Postal Code
                              </Label>
                              <Input
                                id="zipCode"
                                name="address.zipCode"
                                value={formData.address.zipCode}
                                onChange={handleChange}
                                className="bg-accent border-zinc-700"
                                placeholder="1207"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="country"
                                className="text-sm text-zinc-400 mb-2 block"
                              >
                                Division
                              </Label>
                              <Select
                                value={formData.address.country}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    address: {
                                      ...formData.address,
                                      country: value,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="bg-accent border-zinc-700">
                                  <SelectValue placeholder="Select Division" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dhk">Dhaka</SelectItem>
                                  <SelectItem value="ctg">
                                    Chittagong
                                  </SelectItem>
                                  <SelectItem value="khu">Khulna</SelectItem>
                                  <SelectItem value="br">Barishal</SelectItem>
                                  <SelectItem value="syl">Sylhet</SelectItem>
                                  <SelectItem value="rj">Rajshahi</SelectItem>
                                  <SelectItem value="mym">
                                    Mymensingh
                                  </SelectItem>
                                  <SelectItem value="rng">Rangpur</SelectItem>
                                  <SelectItem value="com">Comilla</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="bg-primary hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />

      {isMobile && <MobileNav />}

      {isCartOpen && <CartModal />}
    </div>
  );
}
