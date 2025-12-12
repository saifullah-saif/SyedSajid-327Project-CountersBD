"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";

export default function HeroCarousel({ events }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? events.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) =>
      prevIndex === events.length - 1 ? 0 : prevIndex + 1
    );
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="relative h-[80vh] overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="relative h-full w-full">
            <img
              src={
                events[currentIndex]?.image
                  ? events[currentIndex].image
                  : `/placeholder.svg?height=700&width=1600`
              }
              alt={events[currentIndex]?.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent"></div>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
              <div className="container mx-auto">
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full uppercase">
                      {events[currentIndex]?.genre}
                    </span>
                    <span className="text-zinc-300 text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(events[currentIndex]?.date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-bold mb-3">
                    {events[currentIndex]?.title}
                  </h2>

                  <div className="flex items-center text-zinc-300 mb-6">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {events[currentIndex]?.location.venue},{" "}
                      {events[currentIndex]?.location.city}
                    </span>
                  </div>

                  <Button
                    size="xl"
                    className="p-2 bg-red-600 hover:bg-red-700"
                    onClick={() => handleEventClick(events[currentIndex]?.id)}
                  >
                    Get Tickets
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
        onClick={handleNext}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {events.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full ${
              index === currentIndex ? "bg-red-600" : "bg-white/50"
            }`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}
