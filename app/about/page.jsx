"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import CartModal from "@/components/cart-modal";
import AuthModal from "@/components/auth-modal";
import { useCart } from "@/context/cart-context";
import { Award, Users, Clock, Globe, Heart, Ticket } from "lucide-react";

export default function AboutPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCartOpen } = useCart();

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Values
  const values = [
    {
      icon: <Users className="h-10 w-10 text-red-500" />,
      title: "Customer First",
      description:
        "We prioritize our customers in every decision we make, ensuring their needs are always met.",
    },
    {
      icon: <Award className="h-10 w-10 text-red-500" />,
      title: "Excellence",
      description:
        "We strive for excellence in our platform, our service, and our partnerships.",
    },
    {
      icon: <Heart className="h-10 w-10 text-red-500" />,
      title: "Passion",
      description:
        "We're passionate about events and creating memorable experiences for attendees.",
    },
    {
      icon: <Globe className="h-10 w-10 text-red-500" />,
      title: "Inclusivity",
      description:
        "We believe events should be accessible to everyone, regardless of background or ability.",
    },
    {
      icon: <Clock className="h-10 w-10 text-red-500" />,
      title: "Innovation",
      description:
        "We continuously innovate to improve our platform and stay ahead of industry trends.",
    },
    {
      icon: <Ticket className="h-10 w-10 text-red-500" />,
      title: "Transparency",
      description:
        "We believe in transparent pricing and clear communication with all stakeholders.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar
        onLoginClick={() => openAuthModal("login")}
        onRegisterClick={() => openAuthModal("register")}
      />

      <main className="pt-0 pb-20 md:pb-8">
        {/* Hero Section */}
        <div className="relative h-[50vh] md:h-[60vh] mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent/70 z-10"></div>
          <img
            src="/placeholder.svg?height=600&width=1600&text=About+Counters"
            alt="About Counters"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end z-20 container mx-auto px-4 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">About Us</h1>
              <p className="text-xl md:text-2xl  max-w-2xl">
                We're revolutionizing the way people discover, book, and
                experience events.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl leading-relaxed">
                At Counters, our mission is to connect people with unforgettable
                experiences. We believe that events have the power to inspire,
                educate, and bring communities together. Our platform makes it
                easy for anyone to discover and attend events that match their
                interests, while providing event organizers with the tools they
                need to reach their audience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-accent rounded-lg p-6 text-center"
                >
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-zinc-400">{value.description}</p>
                </motion.div>
              ))}
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
    </div>
  );
}
