"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import StatsCard from "@/components/admin/stats-card";
import StatusBadge from "@/components/admin/status-badge";
import EmptyState from "@/components/admin/empty-state";
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
import {
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import {
  mockTransactions,
  mockDailySales,
  mockPaymentMethods,
  PaymentStatus,
} from "@/data/admin-mock-data";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate stats
  const totalRevenue = transactions
    .filter((t) => t.payment_status === PaymentStatus.COMPLETED)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.payment_status === PaymentStatus.PENDING)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const refundedAmount = transactions
    .filter((t) => t.payment_status === PaymentStatus.REFUNDED)
    .reduce((sum, t) => sum + t.total_amount, 0);

  const failedCount = transactions.filter(
    (t) => t.payment_status === PaymentStatus.FAILED
  ).length;

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.event_title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.transaction_id
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || transaction.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle view details
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Handle process refund
  const handleProcessRefund = (transaction) => {
    if (transaction.payment_status !== PaymentStatus.COMPLETED) {
      toast.error("Only completed transactions can be refunded");
      return;
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.order_id === transaction.order_id
          ? { ...t, payment_status: PaymentStatus.REFUNDED }
          : t
      )
    );
    toast.success(`Refund processed for order #${transaction.order_id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-zinc-400 mt-1">
              Monitor and manage all platform transactions
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            trend={18.3}
            trendLabel="vs last month"
            iconColor="text-green-500"
            iconBgColor="bg-green-500/10"
          />
          <StatsCard
            title="Pending Payments"
            value={formatCurrency(pendingAmount)}
            icon={Clock}
            iconColor="text-yellow-500"
            iconBgColor="bg-yellow-500/10"
          />
          <StatsCard
            title="Refunded"
            value={formatCurrency(refundedAmount)}
            icon={RefreshCw}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
          />
          <StatsCard
            title="Failed Transactions"
            value={failedCount}
            icon={TrendingUp}
            iconColor="text-red-500"
            iconBgColor="bg-red-500/10"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">
                Daily Revenue (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
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
                      <div className="w-full flex flex-col items-center justify-end h-48">
                        <div
                          className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-md hover:from-primary/80 hover:to-primary/40 transition-all cursor-pointer"
                          style={{ height: `${height}%` }}
                          title={`৳${day.revenue.toLocaleString()}`}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs font-medium mt-1">
                        ৳{(day.revenue / 1000).toFixed(0)}k
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Distribution */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPaymentMethods.map((method, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {method.method}
                      </span>
                      <span className="text-sm text-zinc-400">
                        {method.count} ({method.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                  placeholder="Search by user, event, or transaction ID..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <EmptyState
                title="No transactions found"
                description="Try adjusting your search or filter criteria"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Order ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Event
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Payment Method
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Date
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
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.order_id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm">
                          #{transaction.order_id}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.user_name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {transaction.user_email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">
                          {transaction.event_title}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold">
                              {formatCurrency(transaction.total_amount)}
                            </p>
                            {transaction.additional_fees > 0 && (
                              <p className="text-xs text-zinc-500">
                                +{formatCurrency(transaction.additional_fees)}{" "}
                                fees
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {transaction.payment_method}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {formatDateTime(transaction.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge
                            status={transaction.payment_status}
                            type="payment"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transaction.payment_status ===
                              PaymentStatus.COMPLETED && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcessRefund(transaction)}
                                className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
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

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  Order #{selectedTransaction.order_id}
                </h3>
                <StatusBadge
                  status={selectedTransaction.payment_status}
                  type="payment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Customer</p>
                  <p className="font-medium">{selectedTransaction.user_name}</p>
                  <p className="text-sm text-zinc-500">
                    {selectedTransaction.user_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Event</p>
                  <p className="font-medium">
                    {selectedTransaction.event_title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Transaction ID</p>
                  <p className="font-mono text-sm">
                    {selectedTransaction.transaction_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Payment Method</p>
                  <p className="font-medium">
                    {selectedTransaction.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Tickets</p>
                  <p className="font-medium">
                    {selectedTransaction.tickets_count} tickets
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Transaction Date</p>
                  <p className="font-medium text-sm">
                    {formatDateTime(selectedTransaction.created_at)}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Subtotal</span>
                    <span>
                      {formatCurrency(selectedTransaction.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Service Fee</span>
                    <span>
                      {formatCurrency(selectedTransaction.additional_fees)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-zinc-800 pt-2">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        selectedTransaction.total_amount +
                          selectedTransaction.additional_fees
                      )}
                    </span>
                  </div>
                </div>
              </div>
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
