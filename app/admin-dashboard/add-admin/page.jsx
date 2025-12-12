"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Trash2,
  Search,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/admin/loading-spinner";
import EmptyState from "@/components/admin/empty-state";
import axios from "axios";

export default function AddAdminPage() {
  // State management
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch admins on component mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter admins based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAdmins(admins);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAdmins(
        admins.filter(
          (admin) =>
            admin.name.toLowerCase().includes(query) ||
            admin.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, admins]);

  /**
   * Fetch all admins from the API
   */
  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/admins");

      if (response.data.success) {
        setAdmins(response.data.data);
        setFilteredAdmins(response.data.data);
      } else {
        toast.error("Failed to load admins");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error(error.response?.data?.error || "Failed to load admins");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain at least one number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle add admin form submission
   */
  const handleAddAdmin = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/admin/admins", formData);

      if (response.data.success) {
        toast.success("Admin created successfully!");
        setShowAddModal(false);
        resetForm();
        fetchAdmins(); // Refresh the list
      } else {
        toast.error(response.data.error || "Failed to create admin");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(error.response?.data?.error || "Failed to create admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete admin
   */
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setIsSubmitting(true);

    try {
      const response = await axios.delete(
        `/api/admin/admins?adminId=${selectedAdmin.admin_id}`
      );

      if (response.data.success) {
        toast.success("Admin deleted successfully");
        setShowDeleteModal(false);
        setSelectedAdmin(null);
        fetchAdmins(); // Refresh the list
      } else {
        toast.error(response.data.error || "Failed to delete admin");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error(error.response?.data?.error || "Failed to delete admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form data and errors
   */
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
    });
    setFormErrors({});
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Open add admin modal
   */
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  /**
   * Open delete confirmation modal
   */
  const openDeleteModal = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  /**
   * Get initials from name for avatar
   */
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Management
            </h1>
            <p className="text-zinc-400 mt-2">
              Manage administrator accounts and permissions
            </p>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Admin
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Admins</p>
                <p className="text-2xl font-bold text-zinc-50">
                  {admins.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-50">Admin List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-500"
              />
            </div>

            {/* Table Section */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Loading admins..." />
              </div>
            ) : filteredAdmins.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No admins found"
                description={
                  searchQuery
                    ? "No admins match your search criteria"
                    : "No administrators have been added yet"
                }
              />
            ) : (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-800/50 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-300">Admin</TableHead>
                      <TableHead className="text-zinc-300">Email</TableHead>
                      <TableHead className="text-zinc-300">Status</TableHead>
                      <TableHead className="text-zinc-300">
                        Created Date
                      </TableHead>
                      <TableHead className="text-zinc-300">
                        Last Login
                      </TableHead>
                      <TableHead className="text-zinc-300 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => (
                      <TableRow
                        key={admin.admin_id}
                        className="border-zinc-800 hover:bg-zinc-800/30"
                      >
                        {/* Admin Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={admin.profile_image} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(admin.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-zinc-50">
                                {admin.name}
                              </p>
                              <p className="text-sm text-zinc-400">
                                ID: {admin.admin_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Mail className="h-4 w-4 text-zinc-500" />
                            {admin.email}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {admin.email_verified ? (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </TableCell>

                        {/* Created Date */}
                        <TableCell>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            {formatDate(admin.created_at)}
                          </div>
                        </TableCell>

                        {/* Last Login */}
                        <TableCell className="text-zinc-300">
                          {admin.last_login
                            ? formatDate(admin.last_login)
                            : "Never"}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(admin)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Admin Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Add New Admin
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Create a new administrator account with full system access
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 ${
                    formErrors.name ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 ${
                    formErrors.email ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 ${
                    formErrors.password ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
                <p className="text-xs text-zinc-500">
                  Password must be at least 6 characters with uppercase,
                  lowercase, and number
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Admin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                Delete Admin Account
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                This action cannot be undone. This will permanently delete the
                admin account.
              </DialogDescription>
            </DialogHeader>

            {selectedAdmin && (
              <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedAdmin.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-zinc-50">
                      {selectedAdmin.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {selectedAdmin.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">
                <strong>Warning:</strong> Deleting this admin will remove all
                their access permissions immediately.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAdmin(null);
                }}
                disabled={isSubmitting}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAdmin}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Admin
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
