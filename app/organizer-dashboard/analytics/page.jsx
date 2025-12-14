"use client";
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { DollarSign, Users, Calendar, Ticket, Loader2 } from "lucide-react";
import axios from "axios";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function SalesAnalyticsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState(null);

  // State for data
  const [overview, setOverview] = useState(null);
  const [eventData, setEventData] = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [genreRevenue, setGenreRevenue] = useState([]);

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(true);

  // Fetch overview stats
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoadingOverview(true);
        const response = await axios.get("/api/organizer/analytics/overview");
        if (response.data.success) {
          setOverview(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching overview:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics overview",
          variant: "destructive",
        });
      } finally {
        setLoadingOverview(false);
      }
    };

    if (session?.user) {
      fetchOverview();
    }
  }, [session]);

  // Fetch event data
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await axios.get("/api/organizer/analytics/events");
        if (response.data.success) {
          setEventData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load event analytics",
          variant: "destructive",
        });
      } finally {
        setLoadingEvents(false);
      }
    };

    if (session?.user) {
      fetchEvents();
    }
  }, [session]);

  // Fetch monthly revenue
  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      try {
        setLoadingMonthly(true);
        const response = await axios.get(
          "/api/organizer/analytics/monthly-revenue"
        );
        if (response.data.success) {
          setMonthlyRevenueData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching monthly revenue:", error);
        toast({
          title: "Error",
          description: "Failed to load monthly revenue",
          variant: "destructive",
        });
      } finally {
        setLoadingMonthly(false);
      }
    };

    if (session?.user) {
      fetchMonthlyRevenue();
    }
  }, [session]);

  // Fetch genre revenue
  useEffect(() => {
    const fetchGenreRevenue = async () => {
      try {
        setLoadingGenre(true);
        const response = await axios.get(
          "/api/organizer/analytics/genre-revenue"
        );
        if (response.data.success) {
          setGenreRevenue(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching genre revenue:", error);
        toast({
          title: "Error",
          description: "Failed to load genre analytics",
          variant: "destructive",
        });
      } finally {
        setLoadingGenre(false);
      }
    };

    if (session?.user) {
      fetchGenreRevenue();
    }
  }, [session]);

  // const selectedEvent = useMemo(
  //   () => eventData.find((event) => event.id === selectedEventId),
  //   [selectedEventId, eventData]
  // );

  const selectedEvent = useMemo(
    () => eventData.find((event) => event.id === selectedEventId),
    [selectedEventId, eventData]
  );

  const ticketTypeData = useMemo(() => {
    if (!selectedEvent) return [];
    return Object.entries(selectedEvent.ticketTypes).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [selectedEvent]);

  const isLoading =
    loadingOverview || loadingEvents || loadingMonthly || loadingGenre;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Sales Analytics</h1>

        {/* Statistical Summaries */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-zinc-900 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  ${overview?.totalRevenue?.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Avg. Revenue / Ticket
              </CardTitle>
              <Ticket className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  ${overview?.avgRevenuePerTicket?.toFixed(2) || "0.00"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Top Selling Event
              </CardTitle>
              <Calendar className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              ) : (
                <div className="text-2xl font-bold text-white truncate">
                  {overview?.topSellingEvent || "N/A"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Total Tickets Sold
              </CardTitle>
              <Users className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {overview?.totalTicketsSold?.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMonthly ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : monthlyRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#9CA3AF" }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-zinc-500">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Event</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : eventData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#9CA3AF" }} />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-zinc-500">
                  No events data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Genre</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGenre ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : genreRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreRevenue}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {genreRevenue.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#9CA3AF" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-zinc-500">
                  No genre data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Ticket Types</CardTitle>
              <CardDescription>
                Select an event to see ticket types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                onValueChange={setSelectedEventId}
                disabled={loadingEvents}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {eventData.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEvent && ticketTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240} className="mt-6">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="10%"
                    outerRadius="80%"
                    barSize={10}
                    data={ticketTypeData}
                  >
                    <RadialBar
                      minAngle={15}
                      label={{ position: "insideStart", fill: "#fff" }}
                      background
                      clockWise
                      dataKey="value"
                    />
                    <Legend
                      iconSize={10}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ color: "#9CA3AF" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              ) : selectedEvent ? (
                <div className="flex items-center justify-center h-[240px] mt-6 text-zinc-500">
                  No ticket type data available
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
