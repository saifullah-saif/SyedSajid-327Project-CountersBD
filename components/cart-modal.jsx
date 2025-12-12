"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, ShoppingCart, Trash, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CartModal() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    getCartTotal,
    loading,
  } = useCart();

  const { data: session } = useSession();
  const user = session?.user;
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      toggleCart();
      router.push("/login");
      return;
    }

    toggleCart();
    router.push("/checkout");
  };

  const totalAmount = getCartTotal();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
      <AnimatePresence>
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="w-full max-w-md bg-zinc-900 h-full overflow-auto"
        >
          <div className="p-4 border-b border-accent flex justify-between items-center">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Your Cart</h2>
            </div>
            <button
              className="text-zinc-400 hover:text-white"
              onClick={toggleCart}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center mb-4 animate-pulse">
                <ShoppingCart className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Loading cart...</h3>
              <p className="text-zinc-400">
                Please wait while we fetch your cart items.
              </p>
            </div>
          ) : cart.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-zinc-400 mb-6">
                Looks like you haven't added any tickets yet.
              </p>
              <Button
                onClick={() => {
                  toggleCart();
                  router.push("/events");
                }}
              >
                Browse Events
              </Button>
            </div>
          ) : (
            <div className="p-4">
              {/* Cart items grouped by event */}
              {Object.entries(
                cart.reduce((groups, item) => {
                  const eventId = item.event_id;
                  if (!groups[eventId]) {
                    groups[eventId] = {
                      eventTitle: item.eventTitle,
                      eventDate: item.eventDate,
                      eventImage: item.eventImage,
                      venue: item.venue,
                      city: item.city,
                      items: [],
                      subtotal: 0,
                    };
                  }
                  groups[eventId].items.push(item);
                  groups[eventId].subtotal += item.price * item.quantity;
                  return groups;
                }, {})
              ).map(([eventId, eventGroup]) => (
                <div key={eventId} className="bg-accent rounded-lg p-4 mb-6">
                  <div className="border-b border-zinc-700 pb-2 mb-4">
                    <h3 className="font-medium text-lg">
                      {eventGroup.eventTitle}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {new Date(eventGroup.eventDate).toLocaleDateString()}
                      {eventGroup.venue && ` • ${eventGroup.venue}`}
                      {eventGroup.city && `, ${eventGroup.city}`}
                    </p>
                  </div>

                  <div className="space-y-4 mb-4">
                    {eventGroup.items.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="bg-zinc-700 rounded-lg p-3"
                      >
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{item.ticketType}</h3>
                            <p className="text-xs text-zinc-500">
                              {item.category}
                            </p>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-600 disabled:opacity-50"
                            onClick={() =>
                              removeFromCart(item.order_item_id, item.order_id)
                            }
                            disabled={loading}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Display attendee names */}
                        {item.attendeeInfo && item.attendeeInfo.length > 0 && (
                          <div className="text-sm text-zinc-400 mb-2 border-t border-zinc-600 pt-2">
                            <p className="font-medium text-zinc-300 mb-1">
                              Attendees:
                            </p>
                            <ul className="space-y-1">
                              {item.attendeeInfo.map((attendee, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs flex items-center"
                                >
                                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                                  {attendee.attendee_name} (
                                  {attendee.attendee_email})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-sm text-zinc-400 mb-3">
                          <p>৳{item.price.toFixed(2)} each</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center border border-zinc-600 rounded">
                            <button
                              className="px-2 py-1 text-zinc-400 hover:text-white disabled:opacity-50"
                              onClick={() =>
                                updateQuantity(
                                  item.order_item_id,
                                  item.order_id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              disabled={item.quantity <= 1 || loading}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3">{item.quantity}</span>
                            <button
                              className="px-2 py-1 text-zinc-400 hover:text-white disabled:opacity-50"
                              onClick={() =>
                                updateQuantity(
                                  item.order_item_id,
                                  item.order_id,
                                  item.quantity + 1
                                )
                              }
                              disabled={loading}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="font-medium">
                            ৳{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-700 pt-3 mb-3">
                    <div className="flex justify-between font-medium">
                      <span>Event Subtotal</span>
                      <span>${eventGroup.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between font-bold mt-2">
                      <span>Total</span>
                      <span>${eventGroup.subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1 text-sm"
                      onClick={() => {
                        toggleCart();
                        router.push(`/events/${eventId}`);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add More
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-red-700 text-sm"
                      onClick={() => {
                        // Scenario 2: Single Event Checkout
                        // Navigate with eventId to fetch only orders for this event
                        toggleCart();
                        router.push(`/checkout?eventId=${eventId}`);
                      }}
                    >
                      Checkout Event
                    </Button>
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <div className="bg-accent rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span>Cart Subtotal</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>

                  <div className="border-t border-zinc-700 my-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-primary hover:bg-red-700"
                onClick={() => {
                  // Scenario 3: Checkout All Orders
                  // Navigate without query params to fetch all pending orders
                  if (!user) {
                    toggleCart();
                    router.push("/login");
                    return;
                  }
                  toggleCart();
                  router.push("/checkout");
                }}
                disabled={loading}
              >
                {loading ? "Processing..." : "Checkout All"}
              </Button>

              <button
                className="w-full text-center mt-4 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
                onClick={toggleCart}
                disabled={loading}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
