"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  // Fetch cart from database when user is authenticated and role is 'user'
  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user &&
      session.user.role === "user"
    ) {
      fetchCart();
    } else if (
      status === "unauthenticated" ||
      (status === "authenticated" && session?.user?.role !== "user")
    ) {
      setCart([]);
    }
  }, [status, session]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/cart");

      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error.response?.status !== 401) {
        toast.error("Failed to load cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item) => {
    try {
      setLoading(true);

      const response = await axios.post("/api/cart", {
        eventId: item.eventId,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        category: item.category,
        attendeeInfo: item.attendeeInfo || {
          name: item.attendeeName || "Guest",
          email: item.attendeeEmail || "guest@example.com",
          phone: item.attendeePhone || "0000000000",
        },
      });

      if (response.data.success) {
        await fetchCart();
        toast.success("Added to cart successfully");
        return { success: true };
      }

      return { success: false, message: response.data.error };
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to add to cart";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (orderItemId, orderId) => {
    try {
      setLoading(true);

      const response = await axios.delete(
        `/api/cart?orderId=${orderId}&orderItemId=${orderItemId}`
      );

      if (response.data.success) {
        await fetchCart();
        toast.success("Item removed from cart");
        return { success: true };
      }

      return { success: false, message: response.data.error };
    } catch (error) {
      console.error("Error removing from cart:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to remove from cart";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (orderItemId, orderId, quantity) => {
    try {
      setLoading(true);

      const response = await axios.patch("/api/cart", {
        orderId,
        orderItemId,
        quantity,
      });

      if (response.data.success) {
        await fetchCart();
        return { success: true };
      }

      return { success: false, message: response.data.error };
    } catch (error) {
      console.error("Error updating quantity:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update quantity";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    // Clear cart by removing all items
    for (const item of cart) {
      await removeFromCart(item.order_item_id, item.order_id);
    }
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart,
        getCartTotal,
        getCartCount,
        loading,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
