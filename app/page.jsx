"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import HeroCarousel from "@/components/hero-carousel";
import EventGrid from "@/components/event-grid";
import Benefits from "@/components/benefits";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import FilterSection from "@/components/filter-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import CartModal from "@/components/cart-modal";
import AuthModal from "@/components/auth-modal";
import { useCart } from "@/context/cart-context";
import { Calendar, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Mock data for hero carousel (until we fetch from API)

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [liveEvents, setLiveEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCartOpen } = useCart();

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Fetch data from API
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // Fetch live events, past events, and organizers in parallel
        const [liveResponse, pastResponse, organizersResponse] =
          await Promise.all([
            axios.get("/api/home?type=live"),
            axios.get("/api/home?type=past"),
            axios.get("/api/home?type=organizers"),
          ]);

        setLiveEvents(liveResponse.data.events || []);
        setPastEvents(pastResponse.data.events || []);
        setOrganizers(organizersResponse.data.organizers || []);
      } catch (error) {
        console.error("Error fetching home data:", error);
        // Keep empty arrays as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar
        onLoginClick={() => openAuthModal("login")}
        onRegisterClick={() => openAuthModal("register")}
      />

      <main className="pb-20 md:pb-0">
        <HeroCarousel events={liveEvents.slice(0, 5)} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="container mx-auto px-4 py-8"
        >
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-zinc-400">Loading events...</div>
            </div>
          ) : (
            <>
              <section className="my-12">
                <h2 className="text-2xl font-bold mb-6">Live Events</h2>
                {liveEvents.length > 0 ? (
                  <EventGrid events={liveEvents} />
                ) : (
                  <div className="text-zinc-400 text-center py-8">
                    No live events at the moment
                  </div>
                )}
              </section>

              <section className="my-12">
                <h2 className="text-2xl font-bold mb-6">Past Events</h2>
                <div className="relative overflow-hidden">
                  {/* Left fade effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none"></div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {pastEvents.length > 0 ? (
                      <AutoScrollCarousel events={pastEvents} />
                    ) : (
                      <div className="text-zinc-400 text-center py-8">
                        No past events available
                      </div>
                    )}
                  </motion.div>

                  {/* Right fade effect */}
                  <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none"></div>
                </div>
              </section>

              <section className="my-12">
                <h2 className="text-2xl font-bold mb-6">Popular Organizers</h2>
                <div className="relative overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {organizers.length > 0 ? (
                      <OrganizersScrollCarousel organizers={organizers} />
                    ) : (
                      <div className="text-zinc-400 text-center py-8">
                        No organizers available
                      </div>
                    )}
                  </motion.div>
                </div>
              </section>

              <Benefits />
            </>
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

// Auto-scrolling carousel component
const AutoScrollCarousel = ({ events }) => {
  const carouselRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(
        carouselRef.current.scrollWidth - carouselRef.current.offsetWidth
      );
    }
  }, [events]);

  useEffect(() => {
    let intervalId;

    if (!isDragging) {
      let scrollPosition = 0;
      const scrollStep = 1;

      intervalId = setInterval(() => {
        if (carouselRef.current) {
          scrollPosition += scrollStep;

          // Reset when reaching the end
          if (scrollPosition >= width) {
            scrollPosition = 0;
          }

          carouselRef.current.scrollLeft = scrollPosition;
        }
      }, 30);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [width, isDragging]);

  return (
    <motion.div
      ref={carouselRef}
      className="cursor-grab overflow-hidden"
      whileTap={{ cursor: "grabbing" }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <motion.div
        className="flex"
        drag="x"
        dragConstraints={{ right: 0, left: -width }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      >
        {events.map((event) => (
          <motion.div
            key={event.id}
            className="min-w-[280px] h-full p-2"
            whileHover={{ scale: 1.03 }}
          >
            <div
              className="bg-zinc-800 rounded-lg overflow-hidden h-full cursor-pointer"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <div className="h-40 relative">
                <img
                  src={event.image || `/placeholder.svg?height=160&width=288`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs">
                  {event.genre}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold mb-2 line-clamp-1">{event.title}</h3>

                <div className="space-y-1 mb-3"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

// Auto-scrolling carousel component for organizers
const OrganizersScrollCarousel = ({ organizers }) => {
  const carouselRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(
        carouselRef.current.scrollWidth - carouselRef.current.offsetWidth
      );
    }
  }, [organizers]);

  useEffect(() => {
    let intervalId;

    if (!isDragging) {
      let scrollPosition = 0;
      const scrollStep = 1;

      intervalId = setInterval(() => {
        if (carouselRef.current) {
          scrollPosition += scrollStep;

          // Reset when reaching the end
          if (scrollPosition >= width) {
            scrollPosition = 0;
          }

          carouselRef.current.scrollLeft = scrollPosition;
        }
      }, 30);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [width, isDragging]);

  return (
    <motion.div
      ref={carouselRef}
      className="cursor-grab overflow-hidden"
      whileTap={{ cursor: "grabbing" }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <motion.div
        className="flex"
        drag="x"
        dragConstraints={{ right: 0, left: -width }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      >
        {organizers.map((organizer, index) => (
          <motion.div
            key={index}
            className="min-w-[200px] h-full p-2"
            whileHover={{ scale: 1.03 }}
          >
            <div className="bg-zinc-800 rounded-lg p-4 text-center hover:bg-zinc-700 transition-colors h-[180px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 mx-auto bg-zinc-600 rounded-full mb-3 overflow-hidden">
                <img
                  src={organizer.logo || `/placeholder.svg?height=64&width=64`}
                  alt={organizer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-sm line-clamp-1">
                {organizer.name}
              </h3>
              <p className="text-xs text-zinc-400">
                {organizer.eventCount} events
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
