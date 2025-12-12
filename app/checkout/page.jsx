"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [checkoutData, setCheckoutData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSegments, setExpandedSegments] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch checkout data on mount and when URL params change
  useEffect(() => {
    if (status === "authenticated" && user) {
      fetchCheckoutData();
    } else if (status === "unauthenticated") {
      router.push("/");
    }
    // Re-fetch when query parameters change
  }, [status, user, router]);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters based on URL search params
      const searchParams = new URLSearchParams(window.location.search);
      const orderId = searchParams.get("orderId");
      const eventId = searchParams.get("eventId");

      let apiUrl = "/api/checkout";
      const queryParams = [];

      // Add query parameters if provided
      if (orderId) {
        queryParams.push(`orderId=${orderId}`);
      }
      if (eventId) {
        queryParams.push(`eventId=${eventId}`);
      }

      if (queryParams.length > 0) {
        apiUrl += `?${queryParams.join("&")}`;
      }

      const response = await axios.get(apiUrl);

      if (response.data.success) {
        const data = response.data.data;

        if (!data || data.length === 0) {
          // No pending orders, redirect to events
          toast.info("No pending orders found");
          router.push("/events");
          return;
        }

        setCheckoutData(data);
      } else {
        throw new Error(response.data.error || "Failed to fetch checkout data");
      }
    } catch (error) {
      console.error("Error fetching checkout data:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to load checkout data"
      );
      toast.error("Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSegment = (eventId) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleRemoveOrder = async (orderId) => {
    try {
      const response = await axios.delete(`/api/checkout?orderId=${orderId}`);

      if (response.data.success) {
        toast.success("Order cancelled successfully");
        // Refresh checkout data
        await fetchCheckoutData();
      } else {
        throw new Error(response.data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error removing order:", error);
      toast.error(
        error.response?.data?.error || error.message || "Failed to cancel order"
      );
    }
  };

  const handleProceedToPay = async () => {
    try {
      setProcessingPayment(true);

      // Create checkout sessions for all orders and complete them directly
      const checkoutPromises = checkoutData.map((order) =>
        axios.post("/api/checkout", {
          orderId: order.order_id,
          paymentMethod: "direct",
        })
      );

      const responses = await Promise.all(checkoutPromises);

      // Check if all checkout sessions were completed successfully
      const allSuccess = responses.every((res) => res.data.success);

      if (!allSuccess) {
        const failedResponse = responses.find((res) => !res.data.success);
        throw new Error(
          failedResponse?.data?.error ||
            "Some checkout sessions failed to complete"
        );
      }

      // Calculate total tickets generated
      const totalTickets = responses.reduce(
        (sum, res) => sum + (res.data.data?.ticket_count || 0),
        0
      );

      // Check if any ticket generation failed
      const ticketErrors = responses
        .filter((res) => res.data.data?.ticket_generation_error)
        .map((res) => res.data.data.ticket_generation_error);

      if (ticketErrors.length > 0) {
        toast.warning(
          `Orders completed but some tickets may need regeneration: ${ticketErrors[0]}`
        );
      } else {
        toast.success(
          `Order completed successfully! ${totalTickets} ticket(s) generated.`
        );
      }

      // Redirect to user dashboard/tickets page after successful checkout
      setTimeout(() => {
        router.push("/user-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to process checkout"
      );
      setProcessingPayment(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = checkoutData.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    const totalItems = checkoutData.reduce(
      (sum, order) =>
        sum +
        order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    return { subtotal, totalItems };
  };

  const { subtotal, totalItems } = calculateTotals();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-lg text-zinc-400">Loading checkout data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Checkout</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={fetchCheckoutData}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/events")}>
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!checkoutData || checkoutData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShoppingCart className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Orders to Checkout</h2>
          <p className="text-zinc-400 mb-6">
            You don't have any pending orders. Browse events to get started!
          </p>
          <Button
            onClick={() => router.push("/events")}
            className="bg-red-600 hover:bg-red-700"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-red-500" />
                <h1 className="text-xl font-bold">Checkout</h1>
              </div>
            </div>
            <div className="text-sm text-zinc-400">{totalItems} items</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Orders by Event */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-red-500" />
                Your Orders
              </h2>

              <div className="space-y-4">
                {checkoutData.map((order) => (
                  <div
                    key={order.order_id}
                    className="border border-zinc-700 rounded-lg overflow-hidden"
                  >
                    {/* Order Header */}
                    <div
                      className="p-4 bg-zinc-800 cursor-pointer hover:bg-zinc-750 transition-colors"
                      onClick={() => toggleSegment(order.event.event_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {order.event.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-zinc-400">
                            <span>
                              {new Date(
                                order.event.start_date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span>•</span>
                            <span>
                              {order.event.venue_name ||
                                order.event.location?.venue_name ||
                                "TBA"}
                            </span>
                            {order.event.location?.city && (
                              <>
                                <span>•</span>
                                <span>{order.event.location.city}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              {order.order_items.length} ticket type
                              {order.order_items.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">
                            Order #{order.order_id} •{" "}
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              ৳{order.total_amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-zinc-500 uppercase">
                              {order.payment_status}
                            </div>
                          </div>
                          {expandedSegments[order.event.event_id] ? (
                            <ChevronUp className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Content */}
                    <AnimatePresence>
                      {expandedSegments[order.event.event_id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-3 bg-zinc-850">
                            {/* Event Banner */}
                            {order.event.banner_image && (
                              <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                                <img
                                  src={order.event.banner_image}
                                  alt={order.event.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Order Items */}
                            {order.order_items.map((item) => (
                              <div
                                key={item.order_item_id}
                                className="p-3 bg-zinc-800 rounded-lg"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-base">
                                      {item.ticketName}
                                    </div>
                                    {item.categoryName && (
                                      <div className="text-xs text-zinc-500 mt-1">
                                        {item.categoryName}
                                        {item.categoryType &&
                                          ` • ${item.categoryType}`}
                                      </div>
                                    )}
                                    {item.ticketDescription && (
                                      <div className="text-sm text-zinc-400 mt-1">
                                        {item.ticketDescription}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="font-semibold">
                                      ৳{item.subtotal.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                      ৳{item.unit_price.toFixed(2)} ×{" "}
                                      {item.quantity}
                                    </div>
                                  </div>
                                </div>

                                {/* Attendee Information */}
                                {item.attendee_info &&
                                  item.attendee_info.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-zinc-700">
                                      <div className="text-xs font-medium text-zinc-400 mb-2">
                                        Attendee Details:
                                      </div>
                                      <div className="space-y-2">
                                        {item.attendee_info.map(
                                          (attendee, idx) => (
                                            <div
                                              key={idx}
                                              className="text-xs bg-zinc-900 p-2 rounded"
                                            >
                                              <div className="font-medium text-zinc-300">
                                                {attendee.attendee_name}
                                              </div>
                                              <div className="text-zinc-500 mt-1">
                                                {attendee.attendee_email} •{" "}
                                                {attendee.attendee_phone}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}

                            {/* Event Policy */}
                            {order.event.policy && (
                              <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
                                <div className="text-xs font-medium text-zinc-400 mb-1">
                                  Event Policy:
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {order.event.policy}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() =>
                                  router.push(`/events/${order.event.event_id}`)
                                }
                              >
                                View Event
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() =>
                                  handleRemoveOrder(order.order_id)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel Order
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-zinc-300">
                  <span>
                    Subtotal ({checkoutData.length} order
                    {checkoutData.length > 1 ? "s" : ""})
                  </span>
                  <span>৳{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-zinc-400 text-sm">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="border-t border-zinc-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Payable</span>
                    <span className="text-red-500">৳{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Proceed to Pay Button */}
              <Button
                onClick={handleProceedToPay}
                disabled={processingPayment}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 mb-6 disabled:opacity-50"
                size="lg"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Proceed to Pay ৳${subtotal.toFixed(2)}`
                )}
              </Button>

              {/* Disclaimer */}
              <div className="space-y-4 text-xs text-zinc-400">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-zinc-300 mb-1">
                      Secure Payment
                    </p>
                    <p>
                      Your payment information is encrypted and secure. We use
                      industry-standard SSL encryption.
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="font-medium text-zinc-300 mb-2">
                    Terms & Conditions
                  </p>
                  <ul className="space-y-1">
                    <li>• All ticket sales are final and non-refundable</li>
                    <li>
                      • Tickets are non-transferable unless specified by the
                      organizer
                    </li>
                    <li>
                      • Event details are subject to change by the organizer
                    </li>
                    <li>
                      • You must present valid ID matching the ticket holder's
                      name
                    </li>
                  </ul>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="font-medium text-zinc-300 mb-2">
                    Cancellation Policy
                  </p>
                  <p>
                    In case of event cancellation, full refunds will be
                    processed within 7-10 business days.
                  </p>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-center">
                    By proceeding with payment, you agree to our{" "}
                    <button className="text-red-500 hover:text-red-400 underline">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button className="text-red-500 hover:text-red-400 underline">
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
