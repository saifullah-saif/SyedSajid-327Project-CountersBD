"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import TicketInfoModal from "@/components/ticket-info-modal";
import CartModal from "@/components/cart-modal";
import AuthModal from "@/components/auth-modal";
import { useCart } from "@/context/cart-context";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  CalendarPlus,
  Info,
  MapPinned,
  Building,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { useInterested } from "@/context/interested-context";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [showTicketInfoModal, setShowTicketInfoModal] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCartOpen, addToCart, toggleCart } = useCart();
  const { data: session } = useSession();
  const user = session?.user;
  const { isInInterested, toggleInterested } = useInterested();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/events/${id}`);

        if (response.data.success) {
          setEvent(response.data.data);

          if (
            response.data.data.categories &&
            response.data.data.categories.length > 0
          ) {
            setSelectedDay(response.data.data.categories[0].id.toString());
          }
        } else {
          setError(response.data.error || "Failed to fetch event");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to fetch event"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
          <p className="text-zinc-400 mb-6">
            {error ||
              "The event you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.push("/events")}>
            Browse All Events
          </Button>
        </div>
      </div>
    );
  }

  const handleInterestedClick = () => {
    toggleInterested(event.id);
    // Update toast messages
    toast({
      title: isInInterested(event.id)
        ? "Removed from interested"
        : "Added to interested",
      description: isInInterested(event.id)
        ? `${event.title} has been removed from your interested list`
        : `${event.title} has been added to your interested list`,
      variant: isInInterested(event.id) ? "default" : "success",
    });
  };

  const handleTicketSelection = (ticket, category = null) => {
    setSelectedTickets((prev) => {
      const isSelected = prev.some((t) => t.id === ticket.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== ticket.id);
      } else {
        return [
          ...prev,
          {
            ...ticket,
            quantity: 1,
            categoryId: category?.id || null,
            categoryName: category?.name || "General",
          },
        ];
      }
    });
  };

  const handleBuyNow = async () => {
    if (!user) {
      openAuthModal("login");
      return;
    }

    if (selectedTickets.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket to purchase.",
        variant: "destructive",
      });
      return;
    }

    // Show ticket info modal to collect attendee information
    setShowTicketInfoModal(true);
  };

  const handleTicketInfoComplete = async (ticketsWithAttendeeInfo) => {
    // This function is called after the order is created successfully
    // The modal already handles the order creation and redirect
    console.log("Order completed with attendee info:", ticketsWithAttendeeInfo);
  };

  // Get ticket types from the selected category
  const selectedCategory = event.categories?.find(
    (cat) => cat.id.toString() === selectedDay
  );
  const ticketTypes = selectedCategory?.ticketTypes || [];

  // Get event categories for day selection
  const eventCategories = event.categories || [];

  // Check if event is past (current time is greater than event end_date)
  const isEventPast = () => {
    if (!event.endDate) return false;
    const now = new Date();
    const endDate = new Date(event.endDate);
    return now > endDate;
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar
        onLoginClick={() => openAuthModal("login")}
        onRegisterClick={() => openAuthModal("register")}
      />

      <main className="pb-20 md:pb-8 pt-0">
        <div className="w-full h-[60vh] relative">
          <img
            src={event.image || `/placeholder.svg?height=400&width=1200`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 top-0 bg-gradient-to-t from-background to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-6">
            <div className="container mx-auto">
              <span className="bg-primary text-text-primary text-xs px-2 py-1 rounded-full uppercase">
                {event.genre}
              </span>
              {isEventPast() && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full uppercase ml-2">
                  Event Ended
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-2">
                {event.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2">
              <div className="bg-background-50 rounded-lg p-6 mb-8">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center text-text-secondary">
                    <Calendar className="mr-2" size={18} />
                    <span>
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Clock className="mr-2" size={18} />
                    <span>{event.time || "TBD"}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <MapPin className="mr-2" size={18} />
                    <span>
                      {event.location.venue}, {event.location.city}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <button className="flex items-center gap-2 bg-background-100 hover:bg-background-200 rounded-full px-4 py-2 text-sm transition-colors">
                    <Share2 size={16} />
                    Share
                  </button>
                  <button className="flex items-center gap-2 bg-background-100 hover:bg-background-200 rounded-full px-4 py-2 text-sm transition-colors">
                    <CalendarPlus size={16} />
                    Add to Calendar
                  </button>
                  <button
                    className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                      isInInterested(event.id)
                        ? "bg-primary-600 text-text-primary hover:bg-primary-700"
                        : "bg-background-100 text-text-secondary hover:bg-background-200 hover:text-text-primary"
                    }`}
                    onClick={handleInterestedClick}
                    aria-label={
                      isInInterested(event.id)
                        ? "Remove from interested"
                        : "Add to interested"
                    }
                    title={
                      isInInterested(event.id)
                        ? "Remove from interested"
                        : "Add to interested"
                    }
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isInInterested(event.id) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger
                      value="details"
                      className="flex items-center gap-2 data-[state=active]:bg-zinc-700"
                    >
                      <Info size={16} />
                      <span className="hidden sm:inline">Event Details</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="venue"
                      className="flex items-center gap-2 data-[state=active]:bg-zinc-700"
                    >
                      <MapPinned size={16} />
                      <span className="hidden sm:inline">Venue</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="organizer"
                      className="flex items-center gap-2 data-[state=active]:bg-zinc-700"
                    >
                      <Building size={16} />
                      <span className="hidden sm:inline">Organizer</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="description">
                        <AccordionTrigger>
                          <h3 className="text-xl font-bold text-left">
                            Event Description
                          </h3>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-zinc-300 leading-relaxed">
                            {event.description ||
                              "Join us for an unforgettable night of music, entertainment, and community. This event features top artists and performers in a state-of-the-art venue with amazing acoustics and atmosphere."}
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="policies">
                        <AccordionTrigger>
                          <h3 className="text-xl font-bold text-left">
                            Event Policies
                          </h3>
                        </AccordionTrigger>
                        <AccordionContent>
                          {event.eventPolicy ? (
                            <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
                              {event.eventPolicy}
                            </div>
                          ) : (
                            <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                              <li>No refunds or exchanges</li>
                              <li>Valid ID required for entry</li>
                              <li>
                                No professional cameras or recording equipment
                              </li>
                              <li>No outside food or drinks</li>
                              <li>Event is rain or shine</li>
                            </ul>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {event.artists && event.artists.length > 0 ? (
                        <AccordionItem value="artists">
                          <AccordionTrigger>
                            <h3 className="text-xl font-bold text-left">
                              Featured Artists
                            </h3>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {event.artists && event.artists.length > 0 ? (
                                event.artists.map((artist) => (
                                  <div
                                    key={artist.id}
                                    className="text-center group transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                                  >
                                    {artist.image && (
                                      <div className="aspect-[3/2] bg-accent rounded-lg mb-2 overflow-hidden shadow-md">
                                        <img
                                          src={
                                            artist.image ||
                                            `/placeholder.svg?height=180&width=270&text=${encodeURIComponent(
                                              artist.name
                                            )}`
                                          }
                                          alt={artist.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      </div>
                                    )}
                                    <h3 className="font-medium">
                                      {artist.name}
                                    </h3>
                                    <p className="text-xs text-zinc-400">
                                      Performer
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center text-zinc-400">
                                  <p>
                                    No featured artists information available
                                  </p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ) : null}
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="venue">
                    <div>
                      <h3 className="text-xl font-bold mb-4">
                        Venue Information
                      </h3>
                      <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2">
                          {event.location.venue}
                        </h4>
                        <p className="text-zinc-300 mb-2">
                          {event.location.address ||
                            `123 Main St, ${event.location.city}`}
                        </p>
                        <p className="text-zinc-400 text-sm mb-4">
                          Doors open: 6:00 PM
                        </p>

                        <div className="aspect-video w-full bg-zinc-700 rounded-lg overflow-hidden">
                          <iframe
                            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215151639238!2d-73.98784492426285!3d40.75779657138285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="organizer">
                    <div>
                      <h3 className="text-xl font-bold mb-4">
                        About the Organizer
                      </h3>
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-accent rounded-full mr-4 overflow-hidden">
                          <img
                            src={
                              event.organizer?.logo ||
                              `/placeholder-64px.png?height=64&width=64`
                            }
                            alt="Organizer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {event.organizer?.name || "Event Productions Inc."}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Professional Event Organizer
                          </p>
                        </div>
                      </div>

                      <div className="bg-accent rounded-lg p-4">
                        <h4 className="font-medium mb-2">About Us</h4>
                        <p className="text-zinc-300 text-sm mb-4">
                          {event.organizer?.description ||
                            `${
                              event.organizer?.name || "Event Productions Inc."
                            } is a leading event management company with over 10 years of experience organizing world-class events. We specialize in music festivals, conferences, and cultural events that bring communities together.`}
                        </p>

                        {(event.organizer?.phone ||
                          event.organizer?.website ||
                          event.organizer?.facebook ||
                          event.organizer?.instagram) && (
                          <>
                            <h4 className="font-medium mb-2">
                              Contact Information
                            </h4>
                            <ul className="text-zinc-300 text-sm space-y-1">
                              {event.organizer?.phone && (
                                <li>Phone: {event.organizer.phone}</li>
                              )}
                              {event.organizer?.website && (
                                <li>
                                  Website:{" "}
                                  <a
                                    href={event.organizer.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {event.organizer.website}
                                  </a>
                                </li>
                              )}
                              {event.organizer?.facebook && (
                                <li>
                                  Facebook:{" "}
                                  <a
                                    href={event.organizer.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    View Profile
                                  </a>
                                </li>
                              )}
                              {event.organizer?.instagram && (
                                <li>
                                  Instagram:{" "}
                                  <a
                                    href={event.organizer.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    View Profile
                                  </a>
                                </li>
                              )}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-background-50 rounded-lg p-6 sticky top-4">
                {isEventPast() ? (
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold mb-4 text-text-secondary">
                      Event Ended
                    </h2>
                    <p className="text-text-muted mb-4">
                      This event has already ended. Tickets are no longer
                      available for purchase.
                    </p>
                    <div className="text-sm text-text-muted">
                      <p>Event ended on:</p>
                      <p className="font-medium">
                        {new Date(event.endDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-4">Get Tickets</h2>

                    {eventCategories.length > 1 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">
                          Select Category
                        </h3>
                        <Tabs
                          value={selectedDay}
                          onValueChange={setSelectedDay}
                        >
                          <TabsList className="w-full">
                            {eventCategories.map((category) => (
                              <TabsTrigger
                                key={category.id}
                                value={category.id.toString()}
                                className="flex-1 data-[state=active]:bg-zinc-700"
                              >
                                {category.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2">
                        Select Ticket Type
                      </h3>
                      {ticketTypes.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {ticketTypes.map((ticket) => (
                            <div
                              key={ticket.id}
                              className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all p-1 ${
                                selectedTickets.some((t) => t.id === ticket.id)
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-zinc-700 hover:border-zinc-500"
                              }`}
                              onClick={() =>
                                handleTicketSelection(ticket, selectedCategory)
                              }
                            >
                              {selectedTickets.some(
                                (t) => t.id === ticket.id
                              ) && (
                                <div className="absolute inset-0 bg-red-900/20 pointer-events-none z-10"></div>
                              )}
                              <div className="h-24 relative">
                                <img
                                  src={ticket.banner || "/placeholder.svg"}
                                  alt={ticket.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-[#121212]/80 px-2 py-1 rounded text-white text-sm">
                                  <span className="font-bold">
                                    ৳{ticket.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4
                                      className={`font-medium ${
                                        selectedTickets.some(
                                          (t) => t.id === ticket.id
                                        )
                                          ? "text-red-400"
                                          : ""
                                      }`}
                                    >
                                      {ticket.name}
                                    </h4>
                                    <p className="text-xs text-zinc-400">
                                      {ticket.description}
                                    </p>
                                    {ticket.quantityAvailable <= 10 &&
                                      ticket.quantityAvailable > 0 && (
                                        <p className="text-xs text-yellow-500 mt-1">
                                          Only {ticket.quantityAvailable}{" "}
                                          tickets left!
                                        </p>
                                      )}
                                    {ticket.quantityAvailable === 0 && (
                                      <p className="text-xs text-red-500 mt-1">
                                        Sold Out
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {selectedTickets.some(
                                  (t) => t.id === ticket.id
                                ) && (
                                  <div
                                    className="mt-3 pt-3 border-t border-zinc-700 flex items-center justify-between"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-sm text-zinc-300">
                                      Quantity:
                                    </span>
                                    <div className="flex items-center border border-zinc-600 rounded-full bg-zinc-700">
                                      <button
                                        className="px-2 py-1 text-zinc-400 hover:text-white disabled:opacity-50 rounded-l-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTickets((prev) =>
                                            prev.map((t) =>
                                              t.id === ticket.id
                                                ? {
                                                    ...t,
                                                    quantity: Math.max(
                                                      1,
                                                      t.quantity - 1
                                                    ),
                                                  }
                                                : t
                                            )
                                          );
                                        }}
                                        disabled={
                                          selectedTickets.find(
                                            (t) => t.id === ticket.id
                                          )?.quantity <= 1
                                        }
                                      >
                                        -
                                      </button>
                                      <span className="px-3 text-sm font-medium">
                                        {selectedTickets.find(
                                          (t) => t.id === ticket.id
                                        )?.quantity || 1}
                                      </span>
                                      <button
                                        className="px-2 py-1 text-zinc-400 hover:text-white disabled:opacity-50 rounded-r-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTickets((prev) =>
                                            prev.map((t) =>
                                              t.id === ticket.id
                                                ? {
                                                    ...t,
                                                    quantity: t.quantity + 1,
                                                  }
                                                : t
                                            )
                                          );
                                        }}
                                        disabled={
                                          selectedTickets.find(
                                            (t) => t.id === ticket.id
                                          )?.quantity >=
                                          Math.min(
                                            ticket.maxPerOrder,
                                            ticket.quantityAvailable
                                          )
                                        }
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-zinc-400">
                          <p>No tickets available for this category</p>
                        </div>
                      )}
                    </div>

                    {selectedTickets.length > 0 && (
                      <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                        {selectedTickets.map((ticket, index) => (
                          <div
                            key={ticket.id}
                            className={`${
                              index !== 0
                                ? "mt-4 pt-4 border-t border-zinc-700"
                                : ""
                            } ${
                              index !== selectedTickets.length - 1
                                ? "mb-4 pb-4 border-b border-zinc-700"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-red-400">
                                  {ticket.name}
                                </h4>
                                <p className="text-xs text-zinc-400">
                                  {ticket.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>
                                Price ({ticket.quantity} x ৳
                                {ticket.price.toFixed(2)})
                              </span>
                              <span>
                                ৳{(ticket.price * ticket.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <div className="flex justify-between mb-2">
                            <span>Subtotal</span>
                            <span>
                              ৳
                              {selectedTickets
                                .reduce(
                                  (sum, ticket) =>
                                    sum + ticket.price * ticket.quantity,
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>

                          <div className="border-t border-zinc-700 my-2 pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>
                              ৳
                              {selectedTickets
                                .reduce(
                                  (sum, ticket) =>
                                    sum + ticket.price * ticket.quantity,
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-primary hover:bg-primary-700"
                      disabled={selectedTickets.length === 0}
                      onClick={handleBuyNow}
                    >
                      {user ? "Buy Now" : "Sign in to Purchase"}
                    </Button>

                    <div className="mt-4 flex items-center justify-center text-xs text-text-muted">
                      <Info size={14} className="mr-1" />
                      <span>Tickets are non-refundable</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
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

      {showTicketInfoModal && (
        <TicketInfoModal
          isOpen={showTicketInfoModal}
          onClose={() => setShowTicketInfoModal(false)}
          selectedTickets={selectedTickets}
          event={event}
          onComplete={handleTicketInfoComplete}
        />
      )}
    </div>
  );
}
