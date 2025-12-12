"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import StatusBadge from "@/components/admin/status-badge";
import EmptyState from "@/components/admin/empty-state";
import LoadingSpinner from "@/components/admin/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// Event status enum
const EventStatus = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export default function EventManagementPage() {
  // Data state
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  /**
   * Fetch all events from API
   */
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/events");
      if (response.data.success) {
        setEvents(response.data.data);
      } else {
        toast.error("Failed to load events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error(error.response?.data?.error || "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle approve event
  const handleApprove = (event) => {
    setSelectedEvent(event);
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedEvent) return;

    setActionLoading(true);
    try {
      const response = await axios.post(
        `/api/admin/events/${selectedEvent.event_id}/approve`
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Event "${selectedEvent.title}" has been approved`
        );
        await fetchEvents(); // Refresh event list
        setShowApproveDialog(false);
        setSelectedEvent(null);
      } else {
        toast.error(response.data.error || "Failed to approve event");
      }
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error(error.response?.data?.error || "Failed to approve event");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject event
  const handleReject = (event) => {
    setSelectedEvent(event);
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
        `/api/admin/events/${selectedEvent.event_id}/reject`,
        { reason: rejectionReason }
      );

      if (response.data.success) {
        toast.error(
          response.data.message ||
            `Event "${selectedEvent.title}" has been rejected`
        );
        await fetchEvents(); // Refresh event list
        setShowRejectDialog(false);
        setSelectedEvent(null);
        setRejectionReason("");
      } else {
        toast.error(response.data.error || "Failed to reject event");
      }
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error(error.response?.data?.error || "Failed to reject event");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Get status counts
  const statusCounts = {
    all: events.length,
    pending: events.filter((e) => e.status === EventStatus.PENDING).length,
    approved: events.filter((e) => e.status === EventStatus.APPROVED).length,
    live: events.filter((e) => e.status === EventStatus.LIVE).length,
    completed: events.filter((e) => e.status === EventStatus.COMPLETED).length,
    cancelled: events.filter((e) => e.status === EventStatus.CANCELLED).length,
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
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-zinc-400 mt-1">
            Review and manage all platform events
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Total Events</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.all}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 border-yellow-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Pending</p>
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
          <Card className="bg-zinc-900 border-zinc-800 border-blue-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Live</p>
              <p className="text-2xl font-bold mt-1 text-blue-500">
                {statusCounts.live}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Completed</p>
              <p className="text-2xl font-bold mt-1">
                {statusCounts.completed}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 border-red-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Cancelled</p>
              <p className="text-2xl font-bold mt-1 text-red-500">
                {statusCounts.cancelled}
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
                  placeholder="Search by event name or organizer..."
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
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Events ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <EmptyState
                title="No events found"
                description="Try adjusting your search or filter criteria"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Event
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Organizer
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Tickets
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Revenue
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr
                        key={event.event_id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {event.genre_name}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {event.organizer_name}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            {formatDate(event.start_date)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-zinc-500" />
                            {event.location_city}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {event.tickets_sold}/{event.total_tickets}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {formatCurrency(event.revenue)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={event.status} type="event" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {event.status === EventStatus.PENDING && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(event)}
                                  className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(event)}
                                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Approve Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this event?
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="py-4">
              <h3 className="font-semibold">{selectedEvent.title}</h3>
              <p className="text-sm text-zinc-400 mt-1">
                by {selectedEvent.organizer_name}
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
              disabled={actionLoading}
              onClick={confirmApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Event
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
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this event.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  by {selectedEvent.organizer_name}
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
                  Reject Event
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
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                <StatusBadge status={selectedEvent.status} type="event" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Organizer</p>
                  <p className="font-medium">{selectedEvent.organizer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Genre</p>
                  <p className="font-medium">{selectedEvent.genre_name}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Start Date</p>
                  <p className="font-medium">
                    {formatDate(selectedEvent.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">End Date</p>
                  <p className="font-medium">
                    {formatDate(selectedEvent.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Venue</p>
                  <p className="font-medium">{selectedEvent.venue_name}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Location</p>
                  <p className="font-medium">{selectedEvent.location_city}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total Tickets</p>
                  <p className="font-medium">{selectedEvent.total_tickets}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Tickets Sold</p>
                  <p className="font-medium">{selectedEvent.tickets_sold}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Revenue</p>
                  <p className="font-medium">
                    {formatCurrency(selectedEvent.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Sale Period</p>
                  <p className="font-medium text-sm">
                    {formatDate(selectedEvent.tickets_sale_start)} -{" "}
                    {formatDate(selectedEvent.tickets_sale_end)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-2">Description</p>
                <p className="text-sm">{selectedEvent.description}</p>
              </div>

              {selectedEvent.event_policy && (
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Event Policy</p>
                  <p className="text-sm">{selectedEvent.event_policy}</p>
                </div>
              )}
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
