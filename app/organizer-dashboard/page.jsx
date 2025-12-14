"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  DollarSign,
  Ticket,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
} from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  isLoading,
}) => (
  <Card className="bg-zinc-900 border-accent">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-zinc-400">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-zinc-400" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <div className="text-sm text-zinc-400">Loading...</div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-white">{value}</div>
          {change !== null && change !== undefined && (
            <div
              className={`flex items-center text-xs mt-1 ${
                changeType === "positive" ? "text-green-500" : "text-red-500"
              }`}
            >
              {changeType === "positive" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(change).toFixed(1)}% from last month
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const SimpleChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400">
        No data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.month} className="flex items-center gap-4">
          <div className="w-8 text-sm text-zinc-400">{item.month}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-zinc-300">
                ৳{item.revenue.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">
                {item.tickets} tickets
              </span>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary to-red-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width:
                    maxRevenue > 0
                      ? `${(item.revenue / maxRevenue) * 100}%`
                      : "0%",
                }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    monthlyRevenue: [],
    recentEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data from our new API endpoints
      const [statsResponse, monthlyRevenueResponse, recentEventsResponse] =
        await Promise.all([
          axios.get("/api/organizer/dashboard/stats"),
          axios.get("/api/organizer/dashboard/revenue?months=6"),
          axios.get("/api/organizer/dashboard/recent-events?limit=3"),
        ]);

      setDashboardData({
        stats: statsResponse.data.data,
        monthlyRevenue: monthlyRevenueResponse.data.data,
        recentEvents: recentEventsResponse.data.data,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");

      // Set fallback data in case of error
      setDashboardData({
        stats: {
          totalRevenue: 0,
          totalTicketsSold: 0,
          activeEvents: 0,
          totalAttendees: 0,
          changes: {
            revenueChange: 0,
            ticketsChange: 0,
            eventsChange: 0,
            attendeesChange: 0,
          },
        },
        monthlyRevenue: [],
        recentEvents: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const { stats, monthlyRevenue, recentEvents } = dashboardData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && (
          <Card className="bg-red-900/20 border-red-500">
            <CardContent className="p-4">
              <div className="text-red-400 text-sm">{error}</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchDashboardData}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={stats ? `৳${stats.totalRevenue.toLocaleString()}` : "$0"}
            icon={DollarSign}
            change={stats?.changes?.revenueChange}
            changeType={
              stats?.changes?.revenueChange >= 0 ? "positive" : "negative"
            }
            isLoading={loading}
          />
          <StatCard
            title="Tickets Sold"
            value={stats ? stats.totalTicketsSold.toLocaleString() : "0"}
            icon={Ticket}
            change={stats?.changes?.ticketsChange}
            changeType={
              stats?.changes?.ticketsChange >= 0 ? "positive" : "negative"
            }
            isLoading={loading}
          />
          <StatCard
            title="Active Events"
            value={stats ? stats.activeEvents : "0"}
            icon={Calendar}
            change={stats?.changes?.eventsChange}
            changeType={
              stats?.changes?.eventsChange >= 0 ? "positive" : "negative"
            }
            isLoading={loading}
          />
          <StatCard
            title="Total Attendees"
            value={stats ? stats.totalAttendees.toLocaleString() : "0"}
            icon={Users}
            change={stats?.changes?.attendeesChange}
            changeType={
              stats?.changes?.attendeesChange >= 0 ? "positive" : "negative"
            }
            isLoading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="bg-zinc-900 border-accent">
            <CardHeader>
              <CardTitle className="text-white">Monthly Revenue</CardTitle>
              <p className="text-sm text-zinc-400">
                Revenue and ticket sales over the last 6 months
              </p>
            </CardHeader>
            <CardContent>
              <SimpleChart data={monthlyRevenue} isLoading={loading} />
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-zinc-900 border-accent">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Events</CardTitle>
                <p className="text-sm text-zinc-400">
                  Your latest event performance
                </p>
              </div>
              <Button
                size="sm"
                className="bg-primary hover:bg-red-700"
                onClick={() =>
                  router.push("/organizer-dashboard/events/create")
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-accent rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-white">{event.name}</h4>
                        <p className="text-sm text-zinc-400">
                          {event.tickets} tickets sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">
                          ৳{String(event.revenue)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            event.status === "live" ||
                            event.status === "approved"
                              ? "bg-green-900 text-green-300"
                              : event.status === "completed"
                              ? "bg-blue-900 text-blue-300"
                              : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-zinc-400">
                  No events found. Create your first event to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
