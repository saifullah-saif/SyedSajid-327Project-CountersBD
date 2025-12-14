"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  TicketIcon,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

const sidebarItems = [
  {
    id: "overview",
    label: "Sales Overview",
    icon: BarChart3,
    href: "/organizer-dashboard",
  },
  {
    id: "events",
    label: "Events",
    icon: Calendar,
    href: "/organizer-dashboard/events",
  },
  // {
  //   id: "sales",
  //   label: "Sales by Events",
  //   icon: TrendingUp,
  //   href: "/organizer-dashboard/analytics",
  // },
  {
    id: "attendees",
    label: "Attendees",
    icon: Users,
    href: "/organizer-dashboard/attendees",
  },

  {
    id: "verify",
    label: "Verify Tickets",
    icon: TicketIcon,
    href: "/organizer-dashboard/scanner",
  },

  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/organizer-dashboard/settings",
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const currentPath = pathname.split("/").pop() || "organizer-dashboard";
  const activeItem = sidebarItems.find(
    (item) =>
      item.href === pathname ||
      (pathname === "/organizer-dashboard" && item.id === "overview")
  );

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Top Navigation */}
      <header className="bg-zinc-900 border-b border-accent px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-accent"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
          <div>
            <Link href="/" className="flex items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/logo.png" alt="Logo" />
              </Avatar>
              <span className="text-xl font-bold text-foreground">
                Counters
              </span>
            </Link>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.image || "/placeholder.svg?height=32&width=32"}
                  alt={user?.name}
                />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">
                  {user?.name || "Organizer"}
                </p>
                <p className="text-xs text-zinc-400">Event Organizer</p>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-accent border border-zinc-700"
            align="end"
          >
            <DropdownMenuItem
              className="cursor-pointer flex items-center hover:bg-zinc-700"
              onClick={() => router.push("/organizer-dashboard/settings")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              className="cursor-pointer flex items-center text-red-500 focus:text-red-500 hover:bg-zinc-700"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(!isMobile || sidebarOpen) && (
            <motion.aside
              initial={isMobile ? { x: -280 } : false}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${
                isMobile
                  ? "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 border-r border-accent"
                  : "w-72 bg-zinc-900 border-r border-accent min-h-screen"
              }`}
            >
              <div className="p-6">
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === pathname ||
                      (pathname === "/organizer-dashboard" &&
                        item.id === "overview");

                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 ${
                          isActive
                            ? "bg-primary text-white hover:bg-red-700"
                            : "text-zinc-300 hover:bg-accent hover:text-white"
                        }`}
                        onClick={() => {
                          router.push(item.href);
                          if (isMobile) setSidebarOpen(false);
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-8 border-t border-accent">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {activeItem?.label || "Dashboard"}
            </h2>
          </div>
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
