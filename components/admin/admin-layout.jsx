"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  BarChart3,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Home,
  ChevronRight,
  CreditCard,
  Bell,
  Search,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const admin = session?.user?.role === "admin" ? session.user : null;

  // Safely destructure admin from context

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ name: "Admin", href: "/admin-dashboard" }];

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[pathSegments.length - 1];
      const pageName =
        currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
      breadcrumbs.push({ name: pageName, href: pathname });
    }

    return breadcrumbs;
  };

  const getPageTitle = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length === 1) return "Dashboard";
    const currentPage = pathSegments[pathSegments.length - 1];
    return currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  };

  const navigation = [
    { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/admin-dashboard/events", icon: Calendar },
    // {
    //   name: "Transactions",
    //   href: "/admin-dashboard/transactions",
    //   icon: CreditCard,
    // },
    {
      name: "Organizers",
      href: "/admin-dashboard/organizers",
      icon: Building2,
    },

    // { name: "Reports", href: "/admin-dashboard/reports", icon: BarChart3 },
    { name: "Admins", href: "/admin-dashboard/add-admin", icon: Shield },
    // { name: "Settings", href: "/admin-dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-accent transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-accent">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isParentActive =
                pathname.startsWith(item.href) &&
                item.href !== "/admin-dashboard";
              const isCurrentlyActive = isActive || isParentActive;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isCurrentlyActive
                      ? "bg-primary text-white shadow-lg"
                      : "text-zinc-300 hover:bg-accent hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`h-5 w-5 mr-3 transition-transform duration-200 ${
                      isCurrentlyActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isCurrentlyActive && (
                    <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-accent">
            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-3">
                Quick Actions
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-accent hover:text-white rounded-lg transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="h-5 w-5 mr-3 group-hover:scale-105 transition-transform" />
              Back to Site
            </Link>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Enhanced Top navbar */}
        <header className="bg-zinc-900 border-b border-accent">
          {/* Main header bar */}
          <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-zinc-400 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Page title for mobile */}
              <div className="lg:hidden">
                <h1 className="text-lg font-semibold text-white">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {console.log(admin)}
              {admin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            admin.avatar ||
                            "/placeholder.svg?height=32&width=32"
                          }
                          alt={admin.name}
                        />
                        <AvatarFallback>
                          {admin.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-accent border border-zinc-700"
                    align="end"
                    forceMount
                  >
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium text-white">
                        {admin.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {admin.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500 font-medium">
                          Admin
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-zinc-700" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center text-red-500 focus:text-red-500 hover:bg-zinc-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="hidden lg:block px-6 py-3 border-t border-accent">
            <nav className="flex items-center space-x-2 text-sm">
              {getBreadcrumbs().map((breadcrumb, index) => (
                <div key={breadcrumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-zinc-500 mx-2" />
                  )}
                  <Link
                    href={breadcrumb.href}
                    className={`${
                      index === getBreadcrumbs().length - 1
                        ? "text-white font-medium"
                        : "text-zinc-400 hover:text-white"
                    } transition-colors`}
                  >
                    {breadcrumb.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
