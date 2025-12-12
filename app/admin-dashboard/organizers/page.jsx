"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import StatusBadge from "@/components/admin/status-badge";
import EmptyState from "@/components/admin/empty-state";
import LoadingSpinner from "@/components/admin/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
  Globe,
  Facebook,
  Instagram,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// Organizer status enum
const OrganizerStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};

export default function OrganizersPage() {
  // Data state
  const [organizers, setOrganizers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch organizers on component mount
  useEffect(() => {
    fetchOrganizers();
  }, []);

  /**
   * Fetch all organizers from API
   */
  const fetchOrganizers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/organizers");
      if (response.data.success) {
        setOrganizers(response.data.data);
      } else {
        toast.error("Failed to load organizers");
      }
    } catch (error) {
      console.error("Error fetching organizers:", error);
      toast.error(error.response?.data?.error || "Failed to load organizers");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter organizers
  const filteredOrganizers = organizers.filter((organizer) => {
    const matchesSearch =
      organizer.organization_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      organizer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || organizer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle approve organizer
  const handleApprove = (organizer) => {
    setSelectedOrganizer(organizer);
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedOrganizer) return;

    setActionLoading(true);
    try {
      const response = await axios.post(
        `/api/admin/organizers/${selectedOrganizer.organizer_id}/approve`
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Organizer "${selectedOrganizer.organization_name}" has been approved`
        );
        await fetchOrganizers(); // Refresh organizer list
        setShowApproveDialog(false);
        setSelectedOrganizer(null);
      } else {
        toast.error(response.data.error || "Failed to approve organizer");
      }
    } catch (error) {
      console.error("Error approving organizer:", error);
      toast.error(error.response?.data?.error || "Failed to approve organizer");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject organizer
  const handleReject = (organizer) => {
    setSelectedOrganizer(organizer);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post(
        `/api/admin/organizers/${selectedOrganizer.organizer_id}/reject`,
        { reason: rejectionReason }
      );

      if (response.data.success) {
        toast.error(
          response.data.message ||
            `Organizer "${selectedOrganizer.organization_name}" has been rejected`
        );
        await fetchOrganizers(); // Refresh organizer list
        setShowRejectDialog(false);
        setSelectedOrganizer(null);
        setRejectionReason("");
      } else {
        toast.error(response.data.error || "Failed to reject organizer");
      }
    } catch (error) {
      console.error("Error rejecting organizer:", error);
      toast.error(error.response?.data?.error || "Failed to reject organizer");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (organizer) => {
    setSelectedOrganizer(organizer);
    setShowDetailsModal(true);
  };

  // Get status counts
  const statusCounts = {
    all: organizers.length,
    pending: organizers.filter((o) => o.status === OrganizerStatus.PENDING)
      .length,
    approved: organizers.filter((o) => o.status === OrganizerStatus.APPROVED)
      .length,
    rejected: organizers.filter((o) => o.status === OrganizerStatus.REJECTED)
      .length,
  };

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Organizer Management</h1>
          <p className="text-zinc-400 mt-1">
            Review and manage event organizer applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Total Organizers</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.all}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 border-yellow-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Pending Review</p>
              <p className="text-2xl font-bold mt-1 text-yellow-500">
                {statusCounts.pending}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 border-green-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Approved</p>
              <p className="text-2xl font-bold mt-1 text-green-500">
                {statusCounts.approved}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 border-red-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Rejected</p>
              <p className="text-2xl font-bold mt-1 text-red-500">
                {statusCounts.rejected}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search by organization name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-zinc-800 border-zinc-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Organizers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrganizers.length === 0 ? (
            <div className="col-span-2">
              <EmptyState
                title="No organizers found"
                description="Try adjusting your search or filter criteria"
              />
            </div>
          ) : (
            filteredOrganizers.map((organizer) => (
              <Card
                key={organizer.organizer_id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={organizer.logo} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Building2 className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-lg truncate">
                            {organizer.organization_name}
                          </h3>
                          <StatusBadge
                            status={organizer.status}
                            type="organizer"
                          />
                        </div>
                      </div>

                      <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                        {organizer.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Mail className="h-4 w-4" />
                          {organizer.email}
                        </div>
                        {organizer.phone_number && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Phone className="h-4 w-4" />
                            {organizer.phone_number}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Calendar className="h-4 w-4" />
                          Applied {formatDate(organizer.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        {organizer.facebook_link && (
                          <a
                            href={organizer.facebook_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-primary transition-colors"
                          >
                            <Facebook className="h-4 w-4" />
                          </a>
                        )}
                        {organizer.insta_link && (
                          <a
                            href={organizer.insta_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-primary transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                        {organizer.web_link && (
                          <a
                            href={organizer.web_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-primary transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {organizer.event_count > 0 && (
                          <span className="ml-auto text-sm text-zinc-400">
                            {organizer.event_count} events
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(organizer)}
                          className="flex-1"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {organizer.status === OrganizerStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(organizer)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReject(organizer)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Approve Organizer</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this organizer?
            </DialogDescription>
          </DialogHeader>
          {selectedOrganizer && (
            <div className="py-4">
              <h3 className="font-semibold">
                {selectedOrganizer.organization_name}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {selectedOrganizer.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Organizer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Reject Organizer</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this organizer application.
            </DialogDescription>
          </DialogHeader>
          {selectedOrganizer && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">
                  {selectedOrganizer.organization_name}
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  {selectedOrganizer.email}
                </p>
              </div>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 min-h-24"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Organizer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Organizer Details</DialogTitle>
          </DialogHeader>
          {selectedOrganizer && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedOrganizer.logo} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedOrganizer.organization_name}
                  </h3>
                  <StatusBadge
                    status={selectedOrganizer.status}
                    type="organizer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Email</p>
                  <p className="font-medium">{selectedOrganizer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Phone</p>
                  <p className="font-medium">
                    {selectedOrganizer.phone_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Application Date</p>
                  <p className="font-medium">
                    {formatDate(selectedOrganizer.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total Events</p>
                  <p className="font-medium">{selectedOrganizer.event_count}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-2">Description</p>
                <p className="text-sm">{selectedOrganizer.description}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-2">Social Links</p>
                <div className="flex gap-4">
                  {selectedOrganizer.facebook_link && (
                    <a
                      href={selectedOrganizer.facebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </a>
                  )}
                  {selectedOrganizer.insta_link && (
                    <a
                      href={selectedOrganizer.insta_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </a>
                  )}
                  {selectedOrganizer.web_link && (
                    <a
                      href={selectedOrganizer.web_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>

              {/* organzer events  */}
              {/** 
               * 
               
              {selectedOrganizer.event_count > 0 && (
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Recent Events</p>
                  <div className="space-y-2">
                    {getOrganizerEvents(selectedOrganizer.organizer_id)
                      .slice(0, 3)
                      .map((event) => (
                        <div
                          key={event.event_id}
                          className="p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {formatDate(event.start_date)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
                */}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
