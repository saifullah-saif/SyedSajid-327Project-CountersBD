"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import EventCard from "@/components/event-card";
import { useMediaQuery } from "@/hooks/use-media-query";
import CartModal from "@/components/cart-modal";
import AuthModal from "@/components/auth-modal";
import { useCart } from "@/context/cart-context";
import { Search, Filter, Loader2 } from "lucide-react";
import axios from "axios";

export default function EventsPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [activeFilter, setActiveFilter] = useState("live"); // Changed default from "all" to "upcoming"
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);

  // API data states
  const [events, setEvents] = useState([]);
  const [genres, setGenres] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCartOpen } = useCart();

  // Fetch genres and locations on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [genresRes, locationsRes] = await Promise.all([
          axios.get("/api/genres"),
          axios.get("/api/locations"),
        ]);

        if (genresRes.data.success) {
          setGenres(genresRes.data.data);
        }

        if (locationsRes.data.success) {
          setLocations(locationsRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load filters");
      }
    };

    fetchInitialData();
  }, []);

  // Fetch events when filters change
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (activeFilter && activeFilter !== "all") {
          params.append("status", activeFilter);
        }

        if (selectedGenres.length > 0) {
          params.append("genres", selectedGenres.join(","));
        }

        if (selectedLocations.length > 0) {
          params.append("locations", selectedLocations.join(","));
        }

        if (searchQuery) {
          params.append("search", searchQuery);
        }

        params.append("limit", itemsPerPage.toString());

        const response = await axios.get(`/api/events?${params.toString()}`);

        if (response.data.success) {
          setEvents(response.data.data);
        } else {
          setError(response.data.error || "Failed to fetch events");
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [
    activeFilter,
    selectedGenres,
    selectedLocations,
    searchQuery,
    itemsPerPage,
  ]);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const toggleLocation = (location) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  // Get unique locations from events - now from API
  // const locations = [...new Set(events.map((event) => event.location.city))]

  // Filter events based on active filter, selected genres, locations, and search query
  // Filtering is now done server-side via API
  const filteredEvents = events;

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-5xl font-bold mb-4 md:mb-0">All Events</h1>

            <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="bg-zinc-800 rounded-full pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                className="md:hidden flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                Filters
              </button>

              <select
                className="bg-zinc-800 rounded-full remx-0.25 remy-0.125 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={36}>36 per page</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <aside
              className={`w-full md:w-64 md:block ${
                showFilters ? "block" : "hidden"
              }`}
            >
              <div className="bg-zinc-900 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-4">Event Status</h3>
                <div className="flex flex-wrap gap-2">
                  {["live", "upcoming", "past"].map((filter) => (
                    <button
                      key={filter}
                      className={`px-4 py-2 rounded-full text-sm ${
                        activeFilter === filter
                          ? "bg-red-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-4">Genres</h3>
                <div className="space-y-2">
                  {genres.map((genre) => (
                    <div key={genre.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`genre-${genre.id}`}
                        className="w-4 h-4 rounded border-zinc-600 text-red-600 focus:ring-red-500"
                        checked={selectedGenres.includes(genre.name)}
                        onChange={() => toggleGenre(genre.name)}
                      />
                      <label
                        htmlFor={`genre-${genre.id}`}
                        className="ml-2 text-sm"
                      >
                        {genre.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-4">
                <h3 className="font-semibold mb-4">Locations</h3>
                <div className="space-y-2">
                  {locations.map((location, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`location-${index}`}
                        className="w-4 h-4 rounded border-zinc-600 text-red-600 focus:ring-red-500"
                        checked={selectedLocations.includes(location)}
                        onChange={() => toggleLocation(location)}
                      />
                      <label
                        htmlFor={`location-${index}`}
                        className="ml-2 text-sm"
                      >
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                  <span className="ml-3 text-lg">Loading events...</span>
                </div>
              ) : error ? (
                <div className="bg-zinc-900 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-red-500">
                    Error
                  </h3>
                  <p className="text-zinc-400 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.slice(0, itemsPerPage).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    No events found
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}

              {filteredEvents.length > itemsPerPage && (
                <div className="mt-8 flex justify-center">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-colors">
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
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
