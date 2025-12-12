"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import {
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  MoreVertical,
  Edit,
  BarChart3,
  Download,
  Trash2,
  Eye,
  Loader2,
  
} from "lucide-react";

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: "Summer Music Festival",
    date: "2024-07-15",
    endDate: "2024-07-17",
    location: "Central Park, New York",
    image: "/placeholder.svg?height=200&width=300",
    status: "active",
    ticketsSold: 1250,
    totalTickets: 1500,
    revenue: 62500,
    attendees: 1180,
    categories: ["VIP", "General", "Student"],
  },
  {
    id: 2,
    title: "Tech Conference 2024",
    date: "2024-08-20",
    endDate: "2024-08-22",
    location: "Convention Center, San Francisco",
    image: "/placeholder.svg?height=200&width=300",
    status: "active",
    ticketsSold: 800,
    totalTickets: 1000,
    revenue: 40000,
    attendees: 750,
    categories: ["Early Bird", "Regular", "Premium"],
  },
  {
    id: 3,
    title: "Food & Wine Expo",
    date: "2024-06-10",
    endDate: "2024-06-12",
    location: "Exhibition Hall, Chicago",
    image: "/placeholder.svg?height=200&width=300",
    status: "completed",
    ticketsSold: 600,
    totalTickets: 600,
    revenue: 18000,
    attendees: 580,
    categories: ["Tasting", "Workshop", "VIP"],
  },
  {
    id: 4,
    title: "Art Gallery Opening",
    date: "2024-09-05",
    endDate: "2024-09-05",
    location: "Modern Art Museum, Los Angeles",
    image: "/placeholder.svg?height=200&width=300",
    status: "draft",
    ticketsSold: 0,
    totalTickets: 200,
    revenue: 0,
    attendees: 0,
    categories: ["General", "VIP"],
  },
];

const EventCard = ({
  event,
  onManage,
  onViewSales,
  onExportAttendees,
  onCancel,
}) => {
  const { toast } = useToast();

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
      case "approved":
      case "active":
        return "bg-green-900 text-green-300";
      case "completed":
        return "bg-blue-900 text-blue-300";
      case "draft":
        return "bg-yellow-900 text-yellow-300";
      case "pending":
        return "bg-orange-900 text-orange-300";
      case "cancelled":
        return "bg-red-900 text-red-300";
      default:
        return "bg-zinc-700 text-zinc-300";
    }
  };

  const handleExport = () => {
    onExportAttendees(event.id);
  };

  const handleCancel = () => {
    onCancel(event.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatStatus = (status) => {
    switch (status) {
      case "live":
        return "Live";
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "draft":
        return "Draft";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="bg-zinc-900 border-accent hover:border-zinc-700 transition-colors">
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                event.status
              )}`}
            >
              {formatStatus(event.status)}
            </span>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                {event.title}
              </h3>
              <div className="space-y-1 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{event.event_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {event.location?.name || event.venue || "Location TBD"}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-accent border-zinc-700">
                <DropdownMenuItem
                  onClick={() => onManage(event.id)}
                  className="hover:bg-zinc-700"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Manage Event
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onViewSales(event.id)}
                  className="hover:bg-zinc-700"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Sales
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExport}
                  className="hover:bg-zinc-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Attendees
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCancel}
                  className="hover:bg-zinc-700 text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-accent rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Users className="h-4 w-4" />
                Tickets Sold
              </div>
              <div className="text-white font-bold">
                {event.tickets_sold || 0}/
                {event.ticket_capacity || event.total_tickets || "N/A"}
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-1 mt-2">
                <div
                  className="bg-primary h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((event.tickets_sold || 0) /
                        (event.ticket_capacity || event.total_tickets || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-accent rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Revenue
              </div>
              <div className="text-white font-bold">
                ৳{(event.ticket_sales || event.revenue || 0).toLocaleString()}
              </div>
              <div className="text-zinc-400 text-xs mt-1">
                {event.attendee_count || event.attendees || 0} attendees
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary hover:bg-red-700"
              onClick={() => onManage(event.id)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 hover:bg-accent"
              onClick={() => onViewSales(event.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    draftEvents: 0,
  });

  // Load events data
  useEffect(() => {
    loadEvents();
    loadDashboardStats();
  }, [activeTab, searchTerm]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const filters = {
        status: activeTab === "all" ? undefined : activeTab,
        search: searchTerm || undefined,
      };

      const response = await axios.get("/api/organizer/events", {
        params: filters,
      });
      if (response.data.success) {
        setEvents(response.data.events || []);
      } else {
        throw new Error(response.data.message || "Failed to load events");
      }
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load events",
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await axios.get("/api/organizer/dashboard/stats");
      if (response.data.success) {
        const stats = response.data.data;
        // Get event counts by status
        const allEventsResponse = await axios.get("/api/organizer/events");
        const allEvents = allEventsResponse.data.events || [];

        setDashboardStats({
          totalEvents:
            allEventsResponse.data.pagination?.total || allEvents.length,
          activeEvents: allEvents.filter(
            (e) =>
              e.status === "active" ||
              e.status === "approved" ||
              e.status === "live"
          ).length,
          completedEvents: allEvents.filter((e) => e.status === "completed")
            .length,
          draftEvents: allEvents.filter((e) => e.status === "draft").length,
        });
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchTerm === "" ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleManage = (eventId) => {
    router.push(`/organizer-dashboard/events/${eventId}/manage`);
  };

  // const handleViewSales = (eventId) => {
  //   router.push(`/organizer-dashboard/events/${eventId}/analytics`);
  // };

  // const handleExportAttendees = async (eventId) => {
  //   try {
  //     const response = await manage.exportAttendees(
  //       eventId
  //     );
  //     if (response.success) {
  //       toast({
  //         title: "Export Started",
  //         description: "Attendees data is being exported.",
  //         variant: "success",
  //       });

  //       // Here you could trigger a download or show the data
  //       console.log("Exported data:", response.data);
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Export Failed",
  //       description: error.message || "Failed to export attendees data",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleCancel = async (eventId) => {
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      // Confirm cancellation
      if (
        !window.confirm(`Are you sure you want to cancel "${event.title}"?`)
      ) {
        return;
      }

      const response = await axios.delete(`/api/organizer/events/${eventId}`);
      if (response.data.success) {
        toast({
          title: response.data.cancelled ? "Event Cancelled" : "Event Deleted",
          description: response.data.cancelled
            ? `${event.title} has been cancelled.`
            : `${event.title} has been deleted.`,
        });

        // Reload events to reflect the change
        loadEvents();
      }
    } catch (error) {
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to cancel event",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <Button
            className="bg-primary hover:bg-red-700"
            onClick={() => router.push("/organizer-dashboard/events/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900">
            <TabsTrigger
              className="data-[state=active]:bg-zinc-800"
              value="all"
            >
              All Events
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-zinc-800"
              value="approved"
            >
              Approved
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-zinc-800"
              value="completed"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-zinc-800"
              value="draft"
            >
              Draft
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onManage={handleManage}
                    // onViewSales={handleViewSales}
                    // onExportAttendees={handleExportAttendees}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900 border-accent">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-zinc-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No events found
                  </h3>
                  <p className="text-zinc-400 text-center mb-6">
                    {searchTerm
                      ? "No events match your search criteria."
                      : "You haven't created any events yet."}
                  </p>
                  <Button
                    className="bg-primary hover:bg-red-700"
                    onClick={() =>
                      router.push("/organizer-dashboard/events/create")
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
