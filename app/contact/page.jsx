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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  HelpCircle,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function ContactPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [activeTab, setActiveTab] = useState("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCartOpen } = useCart();

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send the form data to your backend

    setFormSubmitted(true);
    // Reset form after submission
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
    // Show success message for 3 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 3000);
  };

  // FAQ data
  const faqs = [
    {
      question: "How do I purchase tickets?",
      answer:
        "You can purchase tickets by browsing our events, selecting the event you're interested in, choosing your ticket type, and proceeding to checkout. We accept various payment methods including credit accents, debit accents, and digital wallets.",
    },
    {
      question: "Can I get a refund for my tickets?",
      answer:
        "Refund policies vary by event. Generally, tickets are non-refundable unless the event is canceled by the organizer. Please check the specific event's policy before purchasing.",
    },
    {
      question: "How do I access my tickets?",
      answer:
        "After purchasing, your tickets will be available in your account dashboard. You can access them on your mobile device or print them out. Most venues accept digital tickets displayed on your phone.",
    },
    {
      question: "What if an event is canceled or rescheduled?",
      answer:
        "If an event is canceled, you will receive a full refund automatically. For rescheduled events, your tickets will remain valid for the new date. If you cannot attend the rescheduled date, please contact customer support.",
    },
    {
      question: "Can I transfer my tickets to someone else?",
      answer:
        "Yes, you can transfer your tickets to another person through your account dashboard. Simply select the tickets you want to transfer and enter the recipient's email address.",
    },
    {
      question: "Is there a fee for purchasing tickets?",
      answer:
        "Yes, there is a service fee added to the ticket price. This fee covers the cost of processing payments and maintaining our platform. The fee amount is displayed before you complete your purchase.",
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
        <div className="relative h-[40vh] md:h-[60vh] mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent/70 z-10"></div>
          <img
            src="/placeholder.svg?height=400&width=1600&text=Contact+Us"
            alt="Contact Us"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end z-20 container mx-auto px-4 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Contact Us
              </h1>
              <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl">
                We're here to help. Reach out with any questions or feedback.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mb-12"
          >
            <TabsList className="grid grid-cols-2 max-w-md mx-auto">
              <TabsTrigger
                value="contact"
                className="flex items-center gap-2  data-[state=active]:bg-popover"
              >
                <MessageSquare size={16} />
                <span>Contact</span>
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                className="flex items-center gap-2 data-[state=active]:bg-popover"
              >
                <HelpCircle size={16} />
                <span>FAQ</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-accent rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">
                      Send Us a Message
                    </h2>
                    {formSubmitted ? (
                      <div className="bg-green-900/50 border border-green-500 text-green-200 rounded-lg p-4 mb-6">
                        <p className="font-medium">
                          Thank you for your message!
                        </p>
                        <p className="text-sm">
                          We'll get back to you as soon as possible.
                        </p>
                      </div>
                    ) : null}
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-zinc-400 mb-2"
                          >
                            Your Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full bg-accent border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-zinc-400 mb-2"
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-accent border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <div className="mb-6">
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-zinc-400 mb-2"
                        >
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full bg-accent border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="mb-6">
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-zinc-400 mb-2"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full bg-accent border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        ></textarea>
                      </div>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-red-700"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </form>
                  </div>
                </div>

                <div>
                  <div className="bg-accent rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Connect With Us</h2>
                    <div className="flex space-x-6 justify-center">
                      <a
                        href="https://www.facebook.com/profile.php?id=61565175374414"
                        className="bg-accent hover:bg-zinc-700 text-white p-4 rounded-full transition-colors"
                      >
                        <Facebook className="h-7 w-7" />
                      </a>

                      <a
                        href="https://www.instagram.com/countersbd/"
                        className="bg-accent hover:bg-zinc-700 text-white p-4 rounded-full transition-colors"
                      >
                        <Instagram className="h-7 w-7" />
                      </a>
                    </div>
                  </div>

                  <div className="bg-accent rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">
                      Contact Information
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-red-500 mt-1 mr-3" />
                        <div>
                          <h3 className="font-medium">Email Us</h3>
                          <p className="text-zinc-400 text-sm">
                            <a
                              href="mailto:countersbd25@gmail.com"
                              className="hover:text-red-500"
                            >
                              countersbd25@gmail.com
                            </a>
                          </p>
                        </div>
                      </div>
                      {/* call us */}
                      {/* <div className="flex items-start">
                        <Phone className="h-5 w-5 text-red-500 mt-1 mr-3" />
                        <div>
                          <h3 className="font-medium">Call Us</h3>
                          <p className="text-zinc-400 text-sm">
                            <a
                              href="tel:+18005551234"
                              className="hover:text-red-500"
                            >
                              +1 (800) 555-1234
                            </a>
                            <span className="text-xs"> (Toll-free)</span>
                          </p>
                          <p className="text-zinc-400 text-sm">
                            <a
                              href="tel:+12125559876"
                              className="hover:text-red-500"
                            >
                              +1 (212) 555-9876
                            </a>
                            <span className="text-xs"> (International)</span>
                          </p>
                        </div>
                      </div>
                      Headquarters
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-red-500 mt-1 mr-3" />
                        <div>
                          <h3 className="font-medium">Headquarters</h3>
                          <p className="text-zinc-400 text-sm">123 Broadway</p>
                          <p className="text-zinc-400 text-sm">
                            New York, NY 10001
                          </p>
                          <p className="text-zinc-400 text-sm">United States</p>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-8">
              <div className="max-w-3xl mx-auto">
                <div className="bg-accent rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Frequently Asked Questions
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-300">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="mt-8 text-center">
                    <p className="text-zinc-400 mb-4">
                      Can't find what you're looking for?
                    </p>
                    <Button
                      onClick={() => setActiveTab("contact")}
                      className="bg-primary hover:bg-red-700"
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
