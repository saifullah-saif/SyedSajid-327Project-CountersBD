"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import EmptyState from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Mail, Phone, Calendar, DollarSign } from "lucide-react";
import { mockUsers } from "@/data/admin-mock-data";

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle view details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-zinc-400 mt-1">View and manage platform users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Total Users</p>
              <p className="text-2xl font-bold mt-1">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Total Orders</p>
              <p className="text-2xl font-bold mt-1">
                {users.reduce((sum, u) => sum + u.total_orders, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Total Spent</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(users.reduce((sum, u) => sum + u.total_spent, 0))}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Avg. Order Value</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(
                  users.reduce((sum, u) => sum + u.total_spent, 0) /
                    users.reduce((sum, u) => sum + u.total_orders, 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <EmptyState
                title="No users found"
                description="Try adjusting your search criteria"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Joined
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Orders
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                        Total Spent
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.user_id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.first_name[0]}
                                {user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {user.gender}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{user.email}</td>
                        <td className="py-3 px-4 text-sm">
                          {user.phone_number}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {user.total_orders}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {formatCurrency(user.total_spent)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.profile_image} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {selectedUser.first_name[0]}
                    {selectedUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    User ID: {selectedUser.user_id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <p className="font-medium text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Phone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    <p className="font-medium text-sm">
                      {selectedUser.phone_number}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Gender</p>
                  <p className="font-medium mt-1">{selectedUser.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Date of Birth</p>
                  <p className="font-medium mt-1">
                    {formatDate(selectedUser.dob)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Member Since</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    <p className="font-medium text-sm">
                      {formatDate(selectedUser.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h4 className="font-semibold mb-3">Purchase History</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-zinc-400">Total Orders</p>
                          <p className="text-2xl font-bold mt-1">
                            {selectedUser.total_orders}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-zinc-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-zinc-400">Total Spent</p>
                          <p className="text-2xl font-bold mt-1">
                            {formatCurrency(selectedUser.total_spent)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-zinc-600" />
                      </div>
                    </CardContent>
                  </Card>
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
