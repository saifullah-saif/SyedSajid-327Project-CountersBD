"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import axios from "axios";

import {
  CheckCircle,
  XCircle,
  Ticket,
  CalendarDays,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

const TicketDetails = ({
  ticket,
  selectedEvent,
  onClose,
  verificationStatus,
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Determine display status based on verification status
  const isSuccess = verificationStatus === "success";
  const isAlreadyVerified = verificationStatus === "already_verified";
  const isWrongEvent = ticket.tickettypes.events.event_id !== selectedEvent?.id;
  const isError = verificationStatus === "error";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="bg-zinc-900 border-accent max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              isSuccess
                ? "bg-green-900 animate-pulse"
                : isAlreadyVerified
                ? "bg-amber-900"
                : isWrongEvent
                ? "bg-red-900"
                : isError
                ? "bg-red-900"
                : "bg-blue-900"
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="h-12 w-12 text-green-300" />
            ) : isAlreadyVerified ? (
              <CheckCircle className="h-12 w-12 text-amber-400" />
            ) : isWrongEvent ? (
              <XCircle className="h-12 w-12 text-red-400" />
            ) : isError ? (
              <AlertCircle className="h-12 w-12 text-red-400" />
            ) : (
              <Ticket className="h-12 w-12 text-blue-400" />
            )}
          </div>
          <CardTitle className="text-2xl mb-2">
            {isSuccess
              ? "✅ Ticket Verified!"
              : isAlreadyVerified
              ? "Already Verified"
              : isWrongEvent
              ? "Wrong Event"
              : isError
              ? "Verification Failed"
              : "Ticket Found"}
          </CardTitle>
          {isSuccess && (
            <p className="text-green-400 text-sm font-medium">
              Successfully verified at {new Date().toLocaleTimeString()}
            </p>
          )}
          {isWrongEvent && (
            <p className="text-red-400 text-sm font-medium">
              ⚠️ This ticket belongs to a different event
            </p>
          )}
          {isAlreadyVerified && (
            <p className="text-amber-400 text-sm font-medium">
              This ticket was previously verified
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Event:</span>
              <span className="font-medium text-right">
                {ticket.tickettypes.events.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Attendee:</span>
              <span className="font-medium text-right text-lg">
                {ticket.attendee_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Email:</span>
              <span className="font-medium text-right text-sm">
                {ticket.attendee_email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Phone:</span>
              <span className="font-medium text-right text-sm">
                {ticket.attendee_phone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Ticket Type:</span>
              <span className="font-medium text-right">
                {ticket.tickettypes.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Event Date:</span>
              <span className="font-medium text-right">
                {formatDate(ticket.tickettypes.events.start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Venue:</span>
              <span className="font-medium text-right text-sm">
                {ticket.tickettypes.events.venue_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Purchase Date:</span>
              <span className="font-medium text-right text-sm">
                {formatDate(ticket.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Status:</span>
              <span
                className={`font-medium text-right ${
                  isSuccess || ticket.is_validated
                    ? "text-green-400"
                    : "text-blue-400"
                }`}
              >
                {isSuccess || ticket.is_validated
                  ? "✓ Verified"
                  : "Not Verified"}
              </span>
            </div>
            {ticket.is_validated && ticket.validation_time && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Verified At:</span>
                <span className="font-medium text-right text-sm">
                  {new Date(ticket.validation_time).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={onClose}
              className={`w-full ${
                isSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-primary hover:bg-red-700"
              }`}
            >
              {isSuccess ? "Continue Scanning" : "Close"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ScannerPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const user = session?.user;
  const [scannedTicket, setScannedTicket] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'already_verified', 'error'
  const [manualCode, setManualCode] = useState("");
  const [verifiedTickets, setVerifiedTickets] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [eventStats, setEventStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [validationHistory, setValidationHistory] = useState([]);

  // API helper functions
  const fetchTicketByPassId = async (passId) => {
    const response = await axios.get("/api/organizer/scanner/ticket", {
      params: { passId: encodeURIComponent(passId) },
    });
    return response.data;
  };

  const fetchEventsByOrganizer = async (organizerId) => {
    const response = await axios.get("/api/organizer/events");

    if (!response.data.success) {
      throw new Error("Failed to fetch events");
    }
    return response.data;
  };

  const fetchEventScanStats = async (eventId) => {
    const response = await axios.get("/api/organizer/scanner/stats", {
      params: { eventId },
    });
    return response.data;
  };

  const fetchValidationHistory = async (eventId, limit = 10) => {
    const response = await axios.get("/api/organizer/scanner/validations", {
      params: { eventId, limit },
    });
    return response.data;
  };

  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.organizerId) return;

      try {
        setLoadingEvents(true);

        const response = await fetchEventsByOrganizer(user.organizerId);
        if (response.success) {
          setEvents(response.data || response.events || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch event statistics when event is selected
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedEvent) {
        setEventStats(null);

        return;
      }

      try {
        setLoadingStats(true);
        const response = await fetchEventScanStats(selectedEvent.id);
        if (response.success) {
          setEventStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching event stats:", error);
        // Don't show error toast for stats as it's not critical
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [selectedEvent]);

  // Fetch validation history when event is selected
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedEvent) {
        setValidationHistory([]);
        return;
      }

      try {
        const response = await fetchValidationHistory(selectedEvent.id, 10);
        if (response.success) {
          setValidationHistory(response.data?.validations || []);
        }
      } catch (error) {
        console.error("Error fetching validation history:", error);
        // Don't show error toast for history as it's not critical
      }
    };

    fetchHistory();
  }, [selectedEvent, verifiedTickets]); // Refetch when tickets are verified

  const handleManualScan = async () => {
    if (!selectedEvent) {
      toast({
        title: "Select Event First",
        description: "Please select an event before scanning tickets.",
        variant: "destructive",
      });
      return;
    }

    if (!manualCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid ticket code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingTicket(true);

      // Fetch ticket details using the manually entered pass ID
      const response = await fetchTicketByPassId(manualCode.trim());

      if (response.success && response.tickets && response.tickets.length > 0) {
        const ticket = response.tickets[0];

        // Check if ticket already verified
        if (ticket.is_validated) {
          setScannedTicket(ticket);
          setVerificationStatus("already_verified");

          toast({
            title: "Already Verified",
            description: `This ticket was verified on ${new Date(
              ticket.validation_time
            ).toLocaleString()}`,
            variant: "destructive",
          });

          return;
        }

        // Check if ticket belongs to selected event
        if (ticket.tickettypes.events.event_id !== selectedEvent.id) {
          setScannedTicket(ticket);
          setVerificationStatus("error");

          toast({
            title: "Wrong Event",
            description: "This ticket belongs to a different event.",
            variant: "destructive",
          });

          return;
        }

        try {
          const verifyResponse = await axios.put("/api/tickets", {
            passId: manualCode.trim(),
          });

          if (verifyResponse.data.success) {
            // Update ticket status
            ticket.is_validated = true;
            ticket.validation_time = new Date();

            setScannedTicket(ticket);
            setVerificationStatus("success");
            setVerifiedTickets((prev) => new Set([...prev, ticket.pass_id]));

            toast({
              title: "✅ Ticket Verified!",
              description: `${ticket.attendee_name}'s ticket verified successfully`,
              variant: "success",
            });

            // Refresh stats
            if (selectedEvent) {
              try {
                const statsResponse = await fetchEventScanStats(
                  selectedEvent.id
                );
                if (statsResponse.success) {
                  setEventStats(statsResponse.data);
                }
              } catch (error) {
                console.error("Error refreshing stats:", error);
              }
            }
          } else {
            setScannedTicket(ticket);
            setVerificationStatus("error");

            toast({
              title: "Verification Failed",
              description:
                verifyResponse.data.error || "Failed to verify ticket",
              variant: "destructive",
            });
          }
        } catch (verifyError) {
          console.error("Error verifying ticket:", verifyError);

          setScannedTicket(ticket);
          setVerificationStatus("error");

          toast({
            title: "Verification Failed",
            description:
              verifyError.response?.data?.message ||
              "Network error during verification",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Ticket Not Found",
          description: "The entered ticket code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying manual code:", error);
      toast({
        title: "Error",
        description: "Failed to verify ticket code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTicket(false);
      setManualCode("");
    }
  };

  const formatEventDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Event Selection */}
        <Card className="bg-zinc-900 border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Event to Scan
            </CardTitle>
            <p className="text-zinc-400">
              Choose which event you want to scan tickets for
            </p>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-zinc-400">Loading events...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-400">No events found</p>
                  <p className="text-sm text-zinc-500">
                    Create an event to start scanning tickets
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                  className="w-full justify-between border-zinc-700 h-12"
                >
                  {selectedEvent ? (
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="font-medium">{selectedEvent.title}</p>
                        <p className="text-xs text-zinc-400">
                          {formatEventDate(selectedEvent.start_date)} •{" "}
                          {selectedEvent.venue_name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-400">Select an event</span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isEventDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isEventDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.event_id}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEventDropdownOpen(false);
                          setScannedTicket(null);
                        }}
                        className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700 last:border-b-0"
                      >
                        <p className="font-medium text-white">{event.title}</p>
                        <p className="text-xs text-zinc-400">
                          {formatEventDate(event.start_date)} •{" "}
                          {event.venue_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              event.status === "live"
                                ? "bg-green-900 text-green-300"
                                : event.status === "approved"
                                ? "bg-blue-900 text-blue-300"
                                : "bg-yellow-900 text-yellow-300"
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Verification */}
        <Card className="bg-zinc-900 border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Ticket Verification
            </CardTitle>
            <p className="text-zinc-400">
              Enter ticket pass ID to verify attendees
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Ticket Pass ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Enter ticket pass ID"
                  disabled={!selectedEvent}
                  className="flex-1 h-10 px-3 py-2 bg-accent border border-zinc-700 rounded-md text-white placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button
                  onClick={handleManualScan}
                  disabled={!selectedEvent || loadingTicket}
                  className="bg-primary hover:bg-red-700"
                >
                  {loadingTicket ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>

            {!selectedEvent && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Event Required</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Please select an event before entering ticket codes
                </p>
              </div>
            )}

            {selectedEvent && (
              <div className="bg-accent rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Event:</h4>
                <div className="text-sm text-zinc-300">
                  <p>{selectedEvent.title}</p>
                  <p className="text-zinc-400">
                    {formatEventDate(selectedEvent.start_date)} •{" "}
                    {selectedEvent.venue_name}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-zinc-900 border-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Tickets</p>
                  <p className="text-2xl font-bold text-white">
                    {loadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      eventStats?.summary?.totalTickets || 0
                    )}
                  </p>
                </div>
                <Ticket className="h-8 w-8 text-zinc-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Verified Today</p>
                  <p className="text-2xl font-bold text-green-400">
                    {loadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      eventStats?.summary?.todayValidations || 0
                    )}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Validation Rate</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {loadingStats ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${eventStats?.summary?.validationRate || 0}%`
                    )}
                  </p>
                </div>
                <Ticket className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Selected Event</p>
                  <p className="text-lg font-bold text-primary">
                    {selectedEvent
                      ? selectedEvent.title.substring(0, 12) + "..."
                      : "None"}
                  </p>
                </div>
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <Card className="bg-zinc-900 border-accent">
          <CardHeader>
            <CardTitle>Recent Validations</CardTitle>
            <p className="text-zinc-400">
              Latest ticket verifications for{" "}
              {selectedEvent?.title || "this event"}
            </p>
          </CardHeader>
          <CardContent>
            {!selectedEvent ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">
                  Select an event to see validation history
                </p>
                <p className="text-sm text-zinc-500">
                  Choose an event from the dropdown above
                </p>
              </div>
            ) : validationHistory.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No validations yet</p>
                <p className="text-sm text-zinc-500">
                  Start verifying tickets to see history
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {validationHistory.slice(0, 5).map((validation, index) => (
                  <div
                    key={validation.ticket_id || index}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <div>
                        <p className="font-medium text-white">
                          {validation.attendee_name}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {validation.validation_time
                            ? new Date(
                                validation.validation_time
                              ).toLocaleString()
                            : "Just now"}{" "}
                          • {validation.tickettypes?.name || "Standard Ticket"}
                        </p>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs bg-green-900 text-green-300">
                      verified
                    </div>
                  </div>
                ))}
                {validationHistory.length > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700"
                    >
                      View All ({validationHistory.length} total)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Details Modal */}
      {scannedTicket && (
        <TicketDetails
          ticket={scannedTicket}
          selectedEvent={selectedEvent}
          verificationStatus={verificationStatus}
          onClose={() => {
            setScannedTicket(null);
            setVerificationStatus(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
