"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import CartModal from "@/components/cart-modal";
import { useCart } from "@/context/cart-context";
import { useSession, signOut } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  QrCode,
  Edit,
  LogOut,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const { isCartOpen } = useCart();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [activeTab, setActiveTab] = useState("upcoming");
  const [userTickets, setUserTickets] = useState([]);
  const [liveTickets, setLiveTickets] = useState([]);
  const [pastTickets, setPastTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(null);

  useEffect(() => {
    fetchUserTickets();
  }, [router]);

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/tickets");

      if (response.data.success) {
        setUserTickets(response.data.data.tickets);
        setLiveTickets(response.data.data.liveTickets);
        setPastTickets(response.data.data.pastTickets);
      } else {
        console.error("Failed to fetch tickets:", response.data.message);
        toast.error("Failed to load tickets");
        setUserTickets([]);
        setLiveTickets([]);
        setPastTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
      setUserTickets([]);
      setLiveTickets([]);
      setPastTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  // Group tickets by event
  const groupTicketsByEvent = (tickets) => {
    const grouped = tickets.reduce((acc, ticket) => {
      const eventId = ticket.eventId;
      if (!acc[eventId]) {
        acc[eventId] = {
          eventId: ticket.eventId,
          eventTitle: ticket.eventTitle,
          eventImage: ticket.eventImage,
          eventDate: ticket.eventDate,
          eventTime: ticket.eventTime,
          eventLocation: ticket.eventLocation,
          tickets: [],
        };
      }
      acc[eventId].tickets.push(ticket);
      return acc;
    }, {});

    // Convert to array and sort by event date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.eventDate) - new Date(b.eventDate)
    );
  };

  const upcomingEventGroups = groupTicketsByEvent(liveTickets);
  const pastEventGroups = groupTicketsByEvent(pastTickets);
  const downloadTicketPDF = async (ticket) => {
    try {
      setDownloadingPDF(ticket.id);

      const response = await axios.get(
        `/api/tickets/download?ticketId=${ticket.ticket_id}`,
        {
          responseType: "blob",
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${ticket.ticket_id}-${ticket.eventTitle}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Ticket downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download ticket");
    } finally {
      setDownloadingPDF(null);
    }
  };

  const showTicketQR = (ticket) => {
    setSelectedTicket(ticket);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-20 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-zinc-900 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-1 shadow-lg">
                  <div className="w-full h-full bg-accent rounded-xl overflow-hidden">
                    <img
                      src={user.image || `/placeholder.svg?height=80&width=80`}
                      alt={`${user.profile?.first_name || ""} ${
                        user.profile?.last_name || ""
                      }`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    {user?.name ? user.name : user.email}
                  </h1>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 bg-accent rounded-full text-xs text-zinc-300 border border-zinc-700">
                      {userTickets.length} Tickets
                    </span>
                  </div>
                </div>
                <p className="text-zinc-400 mt-1">{user.email}</p>
              </div>

              <div className="flex flex-col flex-wrap gap-3 mt-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-accent border-zinc-700 hover:bg-zinc-700"
                  onClick={() => router.push("/interested")}
                >
                  <Heart className="h-4 w-4 text-red-500" />
                  Interested
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-accent border-zinc-700 hover:bg-zinc-700"
                  onClick={() => router.push("/profile/edit")}
                >
                  <Edit size={16} />
                  Edit Profile
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2 bg-red-700   hover:red-800 border-0"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">My Tickets</h2>

            <Tabs
              defaultValue="upcoming"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-6">
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 data-[state=active]:bg-zinc-700 "
                >
                  Event Passes ({liveTickets.length})
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="flex-1 data-[state=active]:bg-zinc-700"
                >
                  Past Events ({pastTickets.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {loading ? (
                  <div className="bg-accent rounded-lg p-8 text-center">
                    <p className="text-zinc-400">Loading your tickets...</p>
                  </div>
                ) : upcomingEventGroups.length > 0 ? (
                  <div className="space-y-6">
                    {upcomingEventGroups.map((eventGroup) => (
                      <div
                        key={eventGroup.eventId}
                        className="bg-accent rounded-lg p-6"
                      >
                        {/* Event Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={
                                eventGroup.eventImage ||
                                `/placeholder.svg?height=80&width=80`
                              }
                              alt={eventGroup.eventTitle}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">
                              {eventGroup.eventTitle}
                            </h3>
                            <div className="space-y-1">
                              <div className="flex items-center text-zinc-300 text-sm">
                                <Calendar className="mr-2" size={16} />
                                <span>
                                  {new Date(
                                    eventGroup.eventDate
                                  ).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center text-zinc-300 text-sm">
                                <Clock className="mr-2" size={16} />
                                <span>{eventGroup.eventTime || "7:00 PM"}</span>
                              </div>
                              <div className="flex items-center text-zinc-300 text-sm">
                                <MapPin className="mr-2" size={16} />
                                <span>
                                  {eventGroup.eventLocation.venue},{" "}
                                  {eventGroup.eventLocation.city}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                              {eventGroup.tickets.length} Ticket
                              {eventGroup.tickets.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Tickets Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {eventGroup.tickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="bg-zinc-700 rounded-lg p-4 border border-zinc-600"
                            >
                              <div className="flex-col justify-between mb-3">
                                <div className="flex align-center justify-between mb-1">
                                  <span>
                                    <h5 className="font-semibold text-l">
                                      {ticket.attendee_name.toUpperCase()}
                                    </h5>
                                  </span>
                                  <span>
                                    <h4 className="font-bold font-mono text-red-500 text-lg">
                                      {ticket.ticketType}
                                    </h4>
                                  </span>
                                </div>

                                <p className="text-zinc-400 text-xs">
                                  Purchased:{" "}
                                  {new Date(
                                    ticket.purchaseDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs py-1 h-auto bg-zinc-600 border-zinc-500 hover:bg-zinc-500"
                                  onClick={() => showTicketQR(ticket)}
                                >
                                  <QrCode size={12} className="mr-1" />
                                  View QR
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs py-1 h-auto bg-zinc-600 border-zinc-500 hover:bg-zinc-500"
                                  onClick={() => downloadTicketPDF(ticket)}
                                  disabled={downloadingPDF === ticket.id}
                                >
                                  <Download size={12} className="mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-accent rounded-lg p-8 text-center">
                    <h3 className="text-xl font-semibold mb-2">
                      No upcoming events
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      You don't have any tickets for upcoming events
                    </p>
                    <Button onClick={() => router.push("/events")}>
                      Browse Events
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                {loading ? (
                  <div className="bg-accent rounded-lg p-8 text-center">
                    <p className="text-zinc-400">Loading your tickets...</p>
                  </div>
                ) : pastEventGroups.length > 0 ? (
                  <div className="space-y-6">
                    {pastEventGroups.map((eventGroup) => (
                      <div
                        key={eventGroup.eventId}
                        className="bg-accent rounded-lg p-6 opacity-80"
                      >
                        {/* Event Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={
                                eventGroup.eventImage ||
                                `/placeholder.svg?height=80&width=80`
                              }
                              alt={eventGroup.eventTitle}
                              className="w-full h-full object-cover grayscale"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">
                              {eventGroup.eventTitle}
                            </h3>
                            <div className="space-y-1">
                              <div className="flex items-center text-zinc-300 text-sm">
                                <Calendar className="mr-2" size={16} />
                                <span>
                                  {new Date(
                                    eventGroup.eventDate
                                  ).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center text-zinc-300 text-sm">
                                <MapPin className="mr-2" size={16} />
                                <span>
                                  {eventGroup.eventLocation.venue},{" "}
                                  {eventGroup.eventLocation.city}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {eventGroup.tickets.length} Ticket
                              {eventGroup.tickets.length !== 1 ? "s" : ""}
                            </span>
                            <div className="mt-2">
                              <span className="bg-zinc-600 text-white px-3 py-1 rounded-full text-xs">
                                PAST EVENT
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tickets Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {eventGroup.tickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="bg-zinc-700 rounded-lg p-4 border border-zinc-600 opacity-70"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-sm">
                                    {ticket.ticketType}
                                  </h4>
                                  <h5 className="font-semibold text-sm">
                                    {ticket.attendee_name}
                                    {console.log(ticket)}
                                  </h5>
                                  <p className="text-zinc-400 text-xs">
                                    Purchased:{" "}
                                    {new Date(
                                      ticket.purchaseDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="text-zinc-400 font-bold text-sm">
                                  ${ticket.price}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs py-1 h-auto bg-zinc-600 border-zinc-500 hover:bg-zinc-500"
                                  onClick={() => showTicketQR(ticket)}
                                >
                                  <QrCode size={12} className="mr-1" />
                                  View QR
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs py-1 h-auto bg-zinc-600 border-zinc-500 hover:bg-zinc-500"
                                >
                                  <Download size={12} className="mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-accent rounded-lg p-8 text-center">
                    <h3 className="text-xl font-semibold mb-2">
                      No past events
                    </h3>
                    <p className="text-zinc-400">
                      You haven't attended any events yet
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">
              {selectedTicket.eventTitle}
              {console.log(selectedTicket)}
            </h3>

            <div className="bg-white p-6 rounded-lg mb-4">
              <div className="flex justify-center">
                <div className="w-48 h-48">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket.passId}&color=dc2626`}
                    alt="Ticket QR Code"
                    className="w-full h-full"
                  />
                </div>
              </div>
              <p className="text-center text-black font-mono mt-2">
                {selectedTicket.passId}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400">Attendee Name:</span>
                <span className="font-medium">
                  {selectedTicket.attendee_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Attendee Email:</span>
                <span className="font-medium">
                  {selectedTicket.attendee_email}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Ticket Type:</span>
                <span className="font-medium">{selectedTicket.ticketType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Date:</span>
                <span className="font-medium">
                  {new Date(selectedTicket.eventDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Venue:</span>
                <span className="font-medium">
                  {selectedTicket.eventLocation.venue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Purchase Date:</span>
                <span className="font-medium">
                  {new Date(selectedTicket.purchaseDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => downloadTicketPDF(selectedTicket)}
                disabled={downloadingPDF === selectedTicket.id}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {downloadingPDF === selectedTicket.id
                  ? "Downloading..."
                  : "Download"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {isMobile && <MobileNav />}

      {isCartOpen && <CartModal />}
    </div>
  );
}
