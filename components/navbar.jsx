"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/cart-context";
import { Ticket, ShoppingCart, User, Heart, LogOut } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";

export default function Navbar({ onLoginClick, onRegisterClick }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const { toggleCart, getCartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const getDashboardUrl = () => {
    if (!user) return "/user-dashboard"; // Fallback for no user

    const roleType = user?.roleType || user?.role; // Use roleType or fallback to legacy role

    switch (roleType) {
      case "admin":
        return "/admin-dashboard";
      case "organizer":
        return "/organizer-dashboard";
      case "user":
        return "/user-dashboard";
      default:
        return "/user-dashboard";
    }
  };

  const dashboardUrl = getDashboardUrl();

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      toast.error("Error logging out. Please try again.");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <header
      className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 mx-auto max-w-7xl w-[100%] rounded-xl ${
        scrolled
          ? "bg-zinc-900/90 backdrop-blur-sm shadow-lg"
          : "bg-zinc-900/70 backdrop-blur-sm"
      } ${isMobile ? "hidden" : ""}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="" className="h-16 w-16 object-contain" />
            <span className=" text-xl font-bold text-white">Counters</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm hover:text-red-500 transition-colors ${
                pathname === "/" ? "text-red-500" : "text-white"
              }`}
            >
              Home
            </Link>
            <Link
              href="/events"
              className={`text-sm hover:text-red-500 transition-colors ${
                pathname === "/events" || pathname.startsWith("/events/")
                  ? "text-red-500"
                  : "text-white"
              }`}
            >
              Events
            </Link>
            <Link
              href="/about"
              className={`text-sm hover:text-red-500 transition-colors ${
                pathname === "/about" ? "text-red-500" : "text-white"
              }`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`text-sm hover:text-red-500 transition-colors ${
                pathname === "/contact" ? "text-red-500" : "text-white"
              }`}
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {session && (
              <button
                className="relative p-2 text-white hover:text-white"
                onClick={toggleCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </button>
            )}

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          user?.image || "/placeholder.svg?height=32&width=32"
                        }
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-zinc-800 border border-zinc-700"
                  align="end"
                  forceMount
                >
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem asChild>
                    <Link
                      href={String(dashboardUrl)}
                      className="cursor-pointer flex items-center hover:bg-zinc-700"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/interested"
                      className="cursor-pointer flex items-center hover:bg-zinc-700"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Interested</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer flex items-center text-red-500 focus:text-red-500 hover:bg-zinc-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-zinc-800"
                  onClick={onLoginClick}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={onRegisterClick}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
