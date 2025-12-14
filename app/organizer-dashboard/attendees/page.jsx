"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  Mail,
  Phone,
  Ticket,
  User,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import axios from "axios";

export default function AttendeesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  // State for API data
  const [attendeesData, setAttendeesData] = useState([]);
  const [eventsWithAttendees, setEventsWithAttendees] = useState([]);
  const [attendeeAnalytics, setAttendeeAnalytics] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    totalAttendees: 0,
    verified: 0,
    pending: 0,
  });

  // State for UI
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  // Fetch attendees data from API
  useEffect(() => {
    const fetchAttendeesData = async () => {
      if (!session?.user) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get("/api/organizer/attendees");

        if (response.data.success) {
          setAttendeesData(response.data.attendees);
          setEventsWithAttendees(response.data.analytics.eventsWithAttendees);
          setAttendeeAnalytics(response.data.analytics.attendeeAnalytics);
          setAnalyticsData({
            totalAttendees: response.data.analytics.totalAttendees,
            verified: response.data.analytics.verified,
            pending: response.data.analytics.pending,
          });
        } else {
          setError(response.data.message || "Failed to fetch attendees");
        }
      } catch (err) {
        console.error("Error fetching attendees:", err);
        setError(
          err.response?.data?.message ||
            "An error occurred while fetching attendees"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendeesData();
  }, [session]);

  // Colors for charts
  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  // Chart configuration for the new bar chart
  const chartConfig = {
    attendees: {
      label: "Attendees",
      color: "#ef4444",
    },
  };

  // Calculate statistics based on selected event
  const getEventStatistics = () => {
    if (selectedEvent === "all") {
      const totalAttendees = eventsWithAttendees.reduce(
        (sum, event) => sum + event.totalAttendees,
        0
      );
      const totalverified = eventsWithAttendees.reduce(
        (sum, event) => sum + event.verified,
        0
      );
      const totalPending = eventsWithAttendees.reduce(
        (sum, event) => sum + event.pending,
        0
      );
      const attendanceRate =
        totalAttendees > 0
          ? ((totalverified / totalAttendees) * 100).toFixed(1)
          : 0;

      return {
        totalAttendees,
        verified: totalverified,
        pending: totalPending,
        attendanceRate,
      };
    } else {
      const event = eventsWithAttendees.find(
        (e) => e.id.toString() === selectedEvent
      );
      return event
        ? {
            totalAttendees: event.totalAttendees,
            verified: event.verified,
            pending: event.pending,
            attendanceRate: event.attendanceRate,
          }
        : { totalAttendees: 0, verified: 0, pending: 0, attendanceRate: 0 };
    }
  };

  const statistics = getEventStatistics();

  // Filter attendees based on selected event and search term
  const filteredAttendees = useMemo(() => {
    let filtered = attendeesData;

    // Filter by event
    if (selectedEvent !== "all") {
      filtered = filtered.filter(
        (attendee) => attendee.event_id.toString() === selectedEvent
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (attendee) =>
          attendee.name.toLowerCase().includes(searchLower) ||
          attendee.email.toLowerCase().includes(searchLower) ||
          attendee.pass_id.toLowerCase().includes(searchLower) ||
          attendee.phone.toLowerCase().includes(searchLower)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((attendee) => {
        return attendee.verification_status === selectedStatus;
      });
    }

    return filtered;
  }, [selectedEvent, searchTerm, selectedStatus]);

  // Calculate detailed statistics based on filtered data
  const detailedStats = useMemo(() => {
    // Ticket type breakdown
    const ticketTypeBreakdown = {};
    filteredAttendees.forEach((attendee) => {
      ticketTypeBreakdown[attendee.ticket_type] =
        (ticketTypeBreakdown[attendee.ticket_type] || 0) + 1;
    });

    // Recent check-ins (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentCheckIns = filteredAttendees.filter((attendee) => {
      if (!attendee.verification_time) return false;
      const checkInTime = new Date(attendee.verification_time);
      return checkInTime >= yesterday;
    }).length;

    // Purchase date analysis
    const purchasesByMonth = {};
    filteredAttendees.forEach((attendee) => {
      const month = new Date(attendee.purchase_date).toLocaleDateString(
        "en-US",
        { month: "short", year: "numeric" }
      );
      purchasesByMonth[month] = (purchasesByMonth[month] || 0) + 1;
    });

    return {
      ticketTypeBreakdown,
      recentCheckIns,
      purchasesByMonth,
      totalFiltered: filteredAttendees.length,
      verifiedFiltered: filteredAttendees.filter(
        (a) => a.verification_status === "verified"
      ).length,
      pendingFiltered: filteredAttendees.filter(
        (a) => a.verification_status === "pending"
      ).length,
    };
  }, [filteredAttendees]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendees = filteredAttendees.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedEvent, searchTerm, selectedStatus]);

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-500 border-zinc-500/30";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export functionality
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataToExport = filteredAttendees.map((attendee) => ({
        Name: attendee.name,
        Email: attendee.email,
        Phone: attendee.phone,
        "Pass ID": attendee.pass_id,
        "Ticket Type": attendee.ticket_type,
        "Ticket Category": attendee.ticket_category,
        Event: attendee.event_title,
        "Purchase Date": new Date(attendee.purchase_date).toLocaleDateString(),
        "Check-in Status":
          attendee.verification_status === "verified" ? "Verified" : "Pending",
        "Verification Time": formatDate(attendee.verification_time),
      }));

      // Convert to CSV
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || "";
              // Escape commas and quotes in CSV
              return `"${value.toString().replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      const eventName =
        selectedEvent === "all"
          ? "All_Events"
          : eventsWithAttendees
              .find((e) => e.id.toString() === selectedEvent)
              ?.title.replace(/[^a-zA-Z0-9]/g, "_") || "Event";

      const fileName = `${eventName}_Attendees_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        {/* <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Attendees Management
            </h1>
            <p className="text-zinc-400 mt-1">
              View and manage attendee data across all your events
            </p>
          </div>
        </div> */}

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendees by Event Bar Chart */}
          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Attendees by Event
              </CardTitle>
              <p className="text-sm text-zinc-400">
                Total attendees across all events
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={eventsWithAttendees}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 80,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="title"
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      tickFormatter={(value) =>
                        value.length > 15 ? value.slice(0, 15) + "..." : value
                      }
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                              <p className="text-white font-semibold text-sm mb-2">
                                {data.title}
                              </p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-zinc-400 text-xs">
                                    Total:
                                  </span>
                                  <span className="text-white font-medium text-sm">
                                    {data.totalAttendees}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-green-400 text-xs">
                                    Verified:
                                  </span>
                                  <span className="text-green-400 font-medium text-sm">
                                    {data.verified}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-yellow-400 text-xs">
                                    Pending:
                                  </span>
                                  <span className="text-yellow-400 font-medium text-sm">
                                    {data.pending}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="totalAttendees"
                      fill="#FF645C"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    >
                      <LabelList
                        dataKey="totalAttendees"
                        position="top"
                        offset={8}
                        style={{
                          fill: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Status Pie Chart */}
          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendance Status
              </CardTitle>
              <p className="text-sm text-zinc-400">
                {selectedEvent === "all"
                  ? "All Events"
                  : eventsWithAttendees.find(
                      (e) => e.id.toString() === selectedEvent
                    )?.title}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Verified",
                          value: statistics.verified,
                          color: "#22c55e",
                        },
                        {
                          name: "Pending",
                          value: statistics.pending,
                          color: "#eab308",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#eab308" />
                    </Pie>
                    {/* <Tooltip
                      contentStyle={{
                        backgroundColor: "#27272a",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    /> */}
                    <Legend
                      wrapperStyle={{ color: "#ffffff" }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendee Statistics */}
        <div className="space-y-6">
          {/* Main Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-accent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Total Attendees</p>
                    <p className="text-xl font-bold text-white">
                      {statistics.totalAttendees.toLocaleString()}
                    </p>
                    {detailedStats.totalFiltered !==
                      statistics.totalAttendees && (
                      <p className="text-xs text-yellow-400">
                        {detailedStats.totalFiltered.toLocaleString()} filtered
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Ticket className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Verified</p>
                    <p className="text-xl font-bold text-white">
                      {statistics.verified.toLocaleString()}
                    </p>
                    {detailedStats.verifiedFiltered !== statistics.verified && (
                      <p className="text-xs text-yellow-400">
                        {detailedStats.verifiedFiltered.toLocaleString()}{" "}
                        filtered
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-600/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Pending</p>
                    <p className="text-xl font-bold text-white">
                      {statistics.pending.toLocaleString()}
                    </p>
                    {detailedStats.pendingFiltered !== statistics.pending && (
                      <p className="text-xs text-yellow-400">
                        {detailedStats.pendingFiltered.toLocaleString()}{" "}
                        filtered
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-accent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-600/20 rounded-lg">
                    <Ticket className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Ticket Types</p>
                    <p className="text-xl font-bold text-white">
                      {Object.keys(detailedStats.ticketTypeBreakdown).length}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {Object.keys(detailedStats.ticketTypeBreakdown).length > 0
                        ? Object.entries(
                            detailedStats.ticketTypeBreakdown
                          ).sort(([, a], [, b]) => b - a)[0][0]
                        : "None"}{" "}
                      most common
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Breakdown Charts */}
        {detailedStats.totalFiltered > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Type Breakdown */}
            <Card className="bg-zinc-900 border-accent">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ticket Type Distribution
                </CardTitle>
                <p className="text-sm text-zinc-400">
                  Based on {detailedStats.totalFiltered} filtered attendees
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(detailedStats.ticketTypeBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count], index) => {
                      const percentage = (
                        (count / detailedStats.totalFiltered) *
                        100
                      ).toFixed(1);
                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <span className="text-sm text-zinc-300">
                              {type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-accent rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-sm text-white font-medium w-12 text-right">
                              {count}
                            </span>
                            <span className="text-xs text-zinc-400 w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Event
                  </label>
                  <Select
                    value={selectedEvent}
                    onValueChange={setSelectedEvent}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {eventsWithAttendees.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title} ({event.totalAttendees})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background border-border"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendees Table */}
        <Card className="bg-zinc-900 border-accent">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">
                Attendees List ({filteredAttendees.length})
              </CardTitle>
              <p className="text-sm text-zinc-400 mt-1">
                {selectedEvent === "all"
                  ? "Showing attendees from all events"
                  : `Showing attendees for ${
                      eventsWithAttendees.find(
                        (e) => e.id.toString() === selectedEvent
                      )?.title
                    }`}
                {searchTerm && (
                  <span className="text-yellow-400"> • Filtered results</span>
                )}
              </p>
            </div>

            {/* {Export button } */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredAttendees.length === 0 || isExporting}
                className="border-zinc-700 text-white text-md hover:bg-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    <span className="hidden md:inline sm:hidden">Export</span> (
                    {filteredAttendees.length})
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentAttendees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-accent">
                      <TableHead className="text-zinc-400">Attendee</TableHead>
                      <TableHead className="text-zinc-400 hidden md:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="text-zinc-400">
                        Ticket Info
                      </TableHead>
                      <TableHead className="text-zinc-400 hidden lg:table-cell">
                        Event
                      </TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400 hidden xl:table-cell">
                        Verification Time
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAttendees.map((attendee) => (
                      <TableRow
                        key={attendee.id}
                        className="border-accent hover:bg-accent/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* <div className="w-10 h-10 bg-gradient-to-r from-primary to-red-500 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div> */}
                            <div>
                              <p className="font-bold font-Arial text-white text-md">
                                {attendee.name}
                              </p>

                              {/* Show contact info on mobile when contact column is hidden */}
                              <div className="md:hidden mt-1 space-y-1">
                                <p className="text-xs text-zinc-400">
                                  {attendee.email}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {attendee.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <Mail className="h-4 w-4 text-zinc-400" />
                              {attendee.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <Phone className="h-4 w-4 text-zinc-400" />
                              {attendee.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4 text-zinc-400" />
                              <span className="text-sm font-mono text-zinc-300">
                                {attendee.pass_id}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                variant="outline"
                                className="border-zinc-600 text-zinc-300 text-xs"
                              >
                                {attendee.ticket_type}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-zinc-600 text-zinc-300 text-xs"
                              >
                                {attendee.ticket_category}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            <p className="text-white font-medium">
                              {attendee.event_title}
                            </p>
                            <p className="text-zinc-400">
                              {new Date(
                                attendee.purchase_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${getStatusBadge(
                              attendee.verification_status
                            )}`}
                          >
                            {attendee.verification_status === "verified"
                              ? "Verified"
                              : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-sm text-zinc-300">
                            {attendee.verification_time
                              ? formatDate(attendee.verification_time)
                              : "Pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                <Users className="h-12 w-12 mb-4 text-zinc-600" />
                <p className="text-lg font-medium">No attendees found</p>
                <p className="text-sm">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-accent gap-4">
                <div className="text-sm text-zinc-400 order-2 sm:order-1">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredAttendees.length)} of{" "}
                  {filteredAttendees.length} attendees
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="border-zinc-700 text-white hover:bg-accent"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else {
                        // Show current page and adjacent pages
                        if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-primary hover:bg-red-700 w-8 h-8 p-0"
                              : "border-zinc-700 text-white hover:bg-accent w-8 h-8 p-0"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="border-zinc-700 text-white hover:bg-accent"
                  >
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
