"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import StatsCard from "@/components/admin/stats-card";
import StatusBadge from "@/components/admin/status-badge";
import EmptyState from "@/components/admin/empty-state";
import LoadingSpinner from "@/components/admin/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

export default function AdminDashboard() {
  // State for all dashboard data
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetch all dashboard data from API
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch platform statistics
      const statsResponse = await axios.get("/api/admin/stats");
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // Fetch pending events
      const eventsResponse = await axios.get("/api/admin/events");
      if (eventsResponse.data.success) {
        const pending = eventsResponse.data.data
          .filter((e) => e.status === "pending")
          .slice(0, 5);
        setPendingEvents(pending);
      }

      // Fetch pending organizers
      const organizersResponse = await axios.get("/api/admin/organizers");
      if (organizersResponse.data.success) {
        const pending = organizersResponse.data.data.filter(
          (o) => o.status === "pending"
        );
        setPendingOrganizers(pending);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "event_approved":
        return CheckCircle;
      case "event_pending":
        return Clock;
      case "organizer_registered":
        return Users;
      case "transaction":
        return DollarSign;
      case "refund":
        return XCircle;
      default:
        return AlertCircle;
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  // If stats not loaded, show error state
  if (!stats) {
    return (
      <AdminLayout>
        <EmptyState
          title="Failed to Load Dashboard"
          description="There was an error loading the dashboard data. Please refresh the page."
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-zinc-400 mt-1">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers?.toLocaleString() || "0"}
            icon={Users}
            trend={stats.monthlyGrowth?.users}
            trendLabel="vs last month"
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/10"
          />
          <StatsCard
            title="Active Organizers"
            value={stats.totalOrganizers || 0}
            icon={Building2}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
          />
          <StatsCard
            title="Total Events"
            value={stats.totalEvents || 0}
            icon={Calendar}
            trend={stats.monthlyGrowth?.events}
            trendLabel="vs last month"
            iconColor="text-green-500"
            iconBgColor="bg-green-500/10"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue || 0)}
            icon={TrendingUp}
            trend={stats.monthlyGrowth?.revenue}
            trendLabel="vs last month"
            iconColor="text-rose-500"
            iconBgColor="bg-rose-500/10"
          />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Live Events</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.eventsByStatus?.live || 0}
                  </h3>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Tickets Sold</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.totalTicketsSold?.toLocaleString() || "0"}
                  </h3>
                </div>
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Pending Approvals</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {(stats.pendingEvents || 0) +
                      (pendingOrganizers.length || 0)}
                  </h3>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Events */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">
                Pending Events
              </CardTitle>
              <Link href="/admin-dashboard/events">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingEvents.length === 0 ? (
                <EmptyState
                  title="No pending events"
                  description="All events have been reviewed"
                  icon={CheckCircle}
                />
              ) : (
                <div className="space-y-3">
                  {pendingEvents.map((event) => (
                    <div
                      key={event.event_id}
                      className="flex items-start justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{event.title}</h4>
                        <p className="text-sm text-zinc-400 mt-1">
                          by {event.organizer_name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {formatDate(event.start_date)}
                        </p>
                      </div>
                      <StatusBadge status={event.status} type="event" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Organizers */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">
                Pending Organizers
              </CardTitle>
              <Link href="/admin-dashboard/organizers">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingOrganizers.length === 0 ? (
                <EmptyState
                  title="No pending organizers"
                  description="All organizer applications have been reviewed"
                  icon={CheckCircle}
                />
              ) : (
                <div className="space-y-3">
                  {pendingOrganizers.map((organizer) => (
                    <div
                      key={organizer.organizer_id}
                      className="flex items-start justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {organizer.organization_name}
                        </h4>
                        <p className="text-sm text-zinc-400 mt-1">
                          {organizer.email}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Applied {formatDate(organizer.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={organizer.status} type="organizer" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions & Activities */}
        {/**
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">
                Recent Transactions
              </CardTitle>
              <Link href="/admin-dashboard/transactions">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.order_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        Order #{transaction.order_id}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        {transaction.user_name} • {transaction.event_title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {formatDateTime(transaction.created_at)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-sm">
                        {formatCurrency(transaction.total_amount)}
                      </p>
                      <StatusBadge
                        status={transaction.payment_status}
                        type="payment"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          
        </div>
        */}
      </div>
    </AdminLayout>
  );
}
