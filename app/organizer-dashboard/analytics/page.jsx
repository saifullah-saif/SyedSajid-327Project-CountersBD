"use client";
import { useState, useMemo } from "react";
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
import { DollarSign, Users, Calendar, Ticket } from "lucide-react";

const mockEventData = [
  {
    id: "e1",
    name: "Summer Beats Festival",
    revenue: 15400,
    genre: "Music",
    ticketTypes: { VIP: 5000, General: 10400 },
  },
  {
    id: "e2",
    name: "Tech Innovate 2025",
    revenue: 9700,
    genre: "Tech",
    ticketTypes: { "Early Bird": 2000, Standard: 7700 },
  },
  {
    id: "e3",
    name: "Art & Soul Exhibition",
    revenue: 7200,
    genre: "Art",
    ticketTypes: { Member: 3000, Public: 4200 },
  },
  {
    id: "e4",
    name: "Foodie Fest",
    revenue: 12500,
    genre: "Food",
    ticketTypes: { "Tasting Pass": 8000, "General Admission": 4500 },
  },
];

const monthlyRevenueData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 18000 },
  { month: "Mar", revenue: 15000 },
  { month: "Apr", revenue: 22000 },
  { month: "May", revenue: 25000 },
  { month: "Jun", revenue: 30000 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function SalesAnalyticsPage() {
  const [selectedEventId, setSelectedEventId] = useState(null);

  const selectedEvent = useMemo(
    () => mockEventData.find((event) => event.id === selectedEventId),
    [selectedEventId]
  );

  const totalRevenue = useMemo(
    () => mockEventData.reduce((acc, event) => acc + event.revenue, 0),
    []
  );

  const topSellingEvent = useMemo(
    () =>
      mockEventData.reduce((prev, current) =>
        prev.revenue > current.revenue ? prev : current
      ),
    []
  );

  const genreRevenue = useMemo(() => {
    const revenueByGenre = {};
    mockEventData.forEach((event) => {
      if (revenueByGenre[event.genre]) {
        revenueByGenre[event.genre] += event.revenue;
      } else {
        revenueByGenre[event.genre] = event.revenue;
      }
    });
    return Object.entries(revenueByGenre).map(([name, value]) => ({
      name,
      value,
    }));
  }, []);

  const ticketTypeData = useMemo(() => {
    if (!selectedEvent) return [];
    return Object.entries(selectedEvent.ticketTypes).map(([name, value]) => ({
      name,
      value,
    }));
  }, [selectedEvent]);

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
              <div className="text-2xl font-bold text-white">
                ${totalRevenue.toLocaleString()}
              </div>
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
              <div className="text-2xl font-bold text-white">$45.50</div>
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
              <div className="text-2xl font-bold text-white">
                {topSellingEvent.name}
              </div>
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
              <div className="text-2xl font-bold text-white">5,230</div>
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
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Event</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockEventData}>
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
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Genre</CardTitle>
            </CardHeader>
            <CardContent>
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
              <Select onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {mockEventData.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEvent && (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
