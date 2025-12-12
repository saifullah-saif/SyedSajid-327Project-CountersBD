"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, User, Menu, ShoppingCart, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/cart-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import AuthModal from "@/components/auth-modal";
import CartModal from "@/components/cart-modal";

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const { toggleCart, getCartCount, isCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsOpen(false); // Close the mobile menu when opening auth modal
  };

  const getDashboardUrl = () => {
    if (!user) return "/user-dashboard"; // Fallback for no user

    const roleType = user.roleType || user.role; // Use roleType or fallback to legacy role

    switch (roleType) {
      case "admin":
        return "/admin-dashboard";
      case "organizer":
        return "/organizer-dashboard";
      case "user":
        return "/user-dashboard";
      default:
        // Fallback for undefined, null, or unexpected role values

        return "/user-dashboard";
    }
  };

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-zinc-900 border-t border-accent">
          <div className="flex items-center justify-around h-16">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === "/" ? "text-red-500" : "text-zinc-400"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              href="/events"
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === "/events" || pathname.startsWith("/events/")
                  ? "text-red-500"
                  : "text-zinc-400"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs mt-1">Events</span>
            </Link>

            {user ? (
              <button
                onClick={toggleCart}
                className="relative flex flex-col items-center justify-center w-full h-full text-zinc-400"
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartCount() > 0 && (
                  <span className="absolute top-2 right-1/2 transform translate-x-2 -translate-y-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
                <span className="text-xs mt-1">Cart</span>
              </button>
            ) : (
              <> </>
            )}

            {user ? (
              <Link
                href={getDashboardUrl()}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  pathname === getDashboardUrl()
                    ? "text-red-500"
                    : "text-zinc-400"
                }`}
              >
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="flex flex-col items-center justify-center w-full h-full text-zinc-400"
              >
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Sign In</span>
              </button>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center w-full h-full text-zinc-400">
                  <Menu className="h-5 w-5" />
                  <span className="text-xs mt-1">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-zinc-900 text-white border-accent"
              >
                <div className="flex flex-col h-full py-6">
                  <h2 className="text-xl font-bold mb-6">Menu</h2>

                  <nav className="space-y-4">
                    <Link
                      href="/"
                      className={`block px-2 py-2 rounded-lg ${
                        pathname === "/"
                          ? "bg-accent text-red-500"
                          : "text-zinc-300 hover:bg-accent"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/events"
                      className={`block px-2 py-2 rounded-lg ${
                        pathname === "/events"
                          ? "bg-accent text-red-500"
                          : "text-zinc-300 hover:bg-accent"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      Events
                    </Link>
                    <Link
                      href="/about"
                      className={`block px-2 py-2 rounded-lg ${
                        pathname === "/about"
                          ? "bg-accent text-red-500"
                          : "text-zinc-300 hover:bg-accent"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      About
                    </Link>
                    <Link
                      href="/contact"
                      className={`block px-2 py-2 rounded-lg ${
                        pathname === "/contact"
                          ? "bg-accent text-red-500"
                          : "text-zinc-300 hover:bg-accent"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      Contact
                    </Link>

                    {user ? (
                      <>
                        <div className="border-t border-accent my-4 pt-4"></div>
                        <Link
                          href={getDashboardUrl()}
                          className={`block px-2 py-2 rounded-lg ${
                            pathname === getDashboardUrl()
                              ? "bg-accent text-red-500"
                              : "text-zinc-300 hover:bg-accent"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/interested"
                          className={`block px-2 py-2 rounded-lg ${
                            pathname === "/interested"
                              ? "bg-accent text-red-500"
                              : "text-zinc-300 hover:bg-accent"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          Interested
                        </Link>
                        <div className="border-t border-accent my-4 pt-4"></div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-2 py-2 rounded-lg text-red-400 hover:bg-accent hover:text-red-300 flex items-center"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="border-t border-accent my-4 pt-4"></div>
                        <button
                          onClick={() => openAuthModal("login")}
                          className="block w-full text-left px-2 py-2 rounded-lg text-zinc-300 hover:bg-accent"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => openAuthModal("register")}
                          className="block w-full text-left px-2 py-2 rounded-lg text-white bg-primary hover:bg-red-700"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
        />
      )}

      {isCartOpen && <CartModal />}
    </>
  );
}
