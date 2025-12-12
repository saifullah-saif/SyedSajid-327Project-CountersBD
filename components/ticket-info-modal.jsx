"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, User, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TicketInfoModal({
  isOpen,
  onClose,
  selectedTickets,
  event,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [attendeeInfo, setAttendeeInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const router = useRouter();

  // Calculate total number of individual tickets
  const totalTickets = selectedTickets.reduce(
    (sum, ticket) => sum + ticket.quantity,
    0
  );

  // Create array of individual ticket instances with their info
  const ticketInstances = [];
  selectedTickets.forEach((ticket) => {
    for (let i = 0; i < ticket.quantity; i++) {
      ticketInstances.push({
        id: `${ticket.id}-${i}`,
        ticketTypeId: ticket.id,
        ticketTypeName: ticket.name,
        ticketTypeDescription: ticket.description,
        price: ticket.price,
        categoryName: ticket.categoryName || "General",
        instanceNumber: i + 1,
        totalForType: ticket.quantity,
      });
    }
  });

  const currentTicket = ticketInstances[currentStep];

  const handleInputChange = (field, value) => {
    setAttendeeInfo((prev) => ({
      ...prev,
      [currentTicket.id]: {
        ...prev[currentTicket.id],
        [field]: value,
      },
    }));
  };

  const getCurrentAttendeeInfo = () => {
    return (
      attendeeInfo[currentTicket.id] || {
        name: "",
        email: "",
        phone: "",
      }
    );
  };

  const isCurrentStepValid = () => {
    const info = getCurrentAttendeeInfo();
    return info.name && info.email && info.phone;
  };

  const handleNext = () => {
    if (currentStep < ticketInstances.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!isCurrentStepValid()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare order items
      const orderItems = selectedTickets.map((ticket) => ({
        ticket_type_id: ticket.id,
        quantity: ticket.quantity,
        unit_price: ticket.price,
      }));

      // Prepare attendee info from collected data
      const attendeeInfoArray = ticketInstances.map((ticket) => ({
        ticket_type_id: ticket.ticketTypeId,
        attendee_name: attendeeInfo[ticket.id]?.name || "",
        attendee_email: attendeeInfo[ticket.id]?.email || "",
        attendee_phone: attendeeInfo[ticket.id]?.phone || "",
      }));

      // Calculate fees
      const subtotal = selectedTickets.reduce(
        (sum, ticket) => sum + ticket.price * ticket.quantity,
        0
      );

      // Create order via API
      const response = await axios.post("/api/orders", {
        eventId: event.id,
        orderItems,
        attendeeInfo: attendeeInfoArray,

        paymentMethod: null, // Will be set during checkout
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create order");
      }

      const createdOrder = response.data.data;

      // Close the modal
      onClose();

      // Show success message
      toast.success("Order created successfully! Redirecting to checkout...");

      // Scenario 1: Single Order Checkout - Navigate with specific orderId
      // This ensures only this order is fetched and displayed on checkout page
      router.push(`/checkout?orderId=${createdOrder.order_id}`);

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(attendeeInfoArray);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !currentTicket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-zinc-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-accent flex justify-between items-center">
          <h2 className="text-xl font-bold">Attendee Information</h2>
          <button className="text-zinc-400 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="p-4 border-b border-accent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">
              Step {currentStep + 1} of {totalTickets}
            </span>
            <span className="text-sm text-zinc-400">
              {Math.round(((currentStep + 1) / totalTickets) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-accent rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalTickets) * 100}%` }}
            />
          </div>
        </div>

        {/* Event and Ticket Info */}
        <div className="p-4 border-b border-accent bg-accent/50 flex flex-col items-center">
          <h1 className="font-bold text-xl text-red-400 mb-1">{event.title}</h1>
          <div className="text-sm text-zinc-300 mb-2">
            <span className="font-medium">{currentTicket.categoryName}</span> •{" "}
            {currentTicket.ticketTypeName}
          </div>
          <div className="text-xs text-zinc-400">
            Ticket {currentTicket.instanceNumber} of{" "}
            {currentTicket.totalForType}
            {currentTicket.totalForType > 1
              ? ` (${currentTicket.ticketTypeName})`
              : ""}
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  value={getCurrentAttendeeInfo().name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-accent border border-zinc-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="email"
                  value={getCurrentAttendeeInfo().email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-accent border border-zinc-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="tel"
                  value={getCurrentAttendeeInfo().phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(123) 456-7890"
                  className="w-full bg-accent border border-zinc-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </form>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {currentStep < ticketInstances.length - 1 ? (
              <Button
                className="flex-1 bg-primary hover:bg-red-700"
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="flex-1 bg-primary hover:bg-red-700"
                onClick={handleComplete}
                disabled={!isCurrentStepValid() || loading}
              >
                {loading ? "Processing..." : "Complete Purchase"}
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-xs text-zinc-500 text-center">
            Please provide accurate information for each ticket holder. This
            information will be used for event entry and communication.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
