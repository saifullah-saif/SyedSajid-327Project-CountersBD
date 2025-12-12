"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import CartModal from "@/components/cart-modal";
import AuthModal from "@/components/auth-modal";
import { useCart } from "@/context/cart-context";
import { useSession } from "next-auth/react";
import { useInterested } from "@/context/interested-context";
import { Heart, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InterestedPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { interested, toggleInterested, isInInterested } = useInterested();
  const { isCartOpen } = useCart();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  const handleRemoveClick = (event, e) => {
    e.stopPropagation();
    toggleInterested(event);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar
        onLoginClick={() => openAuthModal("login")}
        onRegisterClick={() => openAuthModal("register")}
      />

      <main className="container mx-auto px-4 pt-24 pb-20 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Interested Events</h1>
          </div>

          {interested.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {interested.map((event) => (
                <div
                  key={event.id}
                  className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="h-32 relative">
                    <img
                      src={
                        event.image || `/placeholder.svg?height=160&width=400`
                      }
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-sm">
                      {event.genre}
                    </div>
                    <button
                      className="absolute top-2 left-2 p-2 rounded-full bg-red-600 text-white"
                      onClick={(e) => handleRemoveClick(event, e)}
                      aria-label="Remove from interested"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  <div className="p-3">
                    <h3 className="text-base font-bold mb-1 truncate">
                      {event.title}
                    </h3>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-zinc-300 text-sm">
                        <Calendar className="mr-2" size={16} />
                        <span>
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-zinc-300 text-sm">
                        <Clock className="mr-2" size={16} />
                        <span>{event.time || "7:00 PM"}</span>
                      </div>
                      <div className="flex items-center text-zinc-300 text-sm">
                        <MapPin className="mr-2" size={16} />
                        <span className="truncate">
                          {event.location
                            ? `${event.location.venue || "Venue TBA"}, ${
                                event.location.city || "City TBA"
                              }`
                            : "Location TBA"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">
                        ${event.price || "49.99"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Starting from
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Your interested list is empty
              </h3>
              <p className="text-zinc-400 mb-6">
                Save events you're interested in to view them later
              </p>
              <Button onClick={() => router.push("/events")}>
                Browse Events
              </Button>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />

      {isMobile && <MobileNav />}

      {isCartOpen && <CartModal />}

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
        />
      )}
    </div>
  );
}
