"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import StatsCard from "@/components/admin/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  BarChart3,
} from "lucide-react";
import {
  mockPlatformStats,
  mockDailySales,
  mockGenreDistribution,
  mockTopEvents,
  mockCategorySales,
} from "@/data/admin-mock-data";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("last-7-days");

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
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-zinc-400 mt-1">
              Comprehensive platform insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48 bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={mockPlatformStats.totalUsers.toLocaleString()}
            icon={Users}
            trend={mockPlatformStats.monthlyGrowth.users}
            trendLabel="vs last month"
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/10"
          />
          <StatsCard
            title="Active Organizers"
            value={mockPlatformStats.activeOrganizers}
            icon={Building2}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
          />
          <StatsCard
            title="Total Events"
            value={mockPlatformStats.totalEvents}
            icon={Calendar}
            trend={mockPlatformStats.monthlyGrowth.events}
            trendLabel="vs last month"
            iconColor="text-green-500"
            iconBgColor="bg-green-500/10"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(mockPlatformStats.totalRevenue)}
            icon={TrendingUp}
            trend={mockPlatformStats.monthlyGrowth.revenue}
            trendLabel="vs last month"
            iconColor="text-rose-500"
            iconBgColor="bg-rose-500/10"
          />
        </div>

        {/* Revenue Trend */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <DollarSign className="h-4 w-4" />
              <span>Daily Revenue</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-end justify-between gap-2">
              {mockDailySales.map((day, index) => {
                const maxRevenue = Math.max(
                  ...mockDailySales.map((d) => d.revenue)
                );
                const height = (day.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div className="w-full flex flex-col items-center justify-end h-64">
                      <div className="text-center mb-2">
                        <p className="text-xs font-medium">
                          {formatCurrency(day.revenue)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {day.tickets} tickets
                        </p>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-primary via-primary/80 to-primary/50 rounded-t-lg hover:from-primary/90 hover:via-primary/70 hover:to-primary/40 transition-all cursor-pointer"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-3">
                      {formatDate(day.date)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Events */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Top Performing Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTopEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {event.event_title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {event.tickets_sold} tickets sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(event.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Genre Distribution */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Events by Genre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGenreDistribution.map((genre, index) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-pink-500",
                    "bg-orange-500",
                  ];
                  const color = colors[index % colors.length];
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-sm font-medium">
                            {genre.name}
                          </span>
                        </div>
                        <span className="text-sm text-zinc-400">
                          {genre.events} events ({genre.value}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${genre.value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Sales */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Sales by Ticket Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {mockCategorySales.map((category, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{category.category}</h4>
                    <BarChart3 className="h-4 w-4 text-zinc-500" />
                  </div>
                  <p className="text-2xl font-bold mb-1">
                    {category.tickets_sold}
                  </p>
                  <p className="text-sm text-zinc-400">tickets sold</p>
                  <p className="text-sm font-medium text-primary mt-2">
                    {formatCurrency(category.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Live Events</span>
                  <span className="font-semibold">
                    {mockPlatformStats.liveEvents}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">
                    Pending Approvals
                  </span>
                  <span className="font-semibold">
                    {mockPlatformStats.pendingApprovals}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">
                    Active Organizers
                  </span>
                  <span className="font-semibold">
                    {mockPlatformStats.activeOrganizers}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">User Growth</span>
                  <span className="font-semibold text-green-500">
                    +{mockPlatformStats.monthlyGrowth.users}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Revenue Growth</span>
                  <span className="font-semibold text-green-500">
                    +{mockPlatformStats.monthlyGrowth.revenue}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Event Growth</span>
                  <span className="font-semibold text-green-500">
                    +{mockPlatformStats.monthlyGrowth.events}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Tickets Sold</span>
                  <span className="font-semibold">
                    {mockPlatformStats.totalTicketsSold.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Avg. Price</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      mockPlatformStats.totalRevenue /
                        mockPlatformStats.totalTicketsSold
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Revenue/Event</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      mockPlatformStats.totalRevenue /
                        mockPlatformStats.totalEvents
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
