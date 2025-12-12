"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";

export default function EventCarousel({ events }) {
  const router = useRouter();
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { current } = carouselRef;
      const scrollAmount = direction === "left" ? -400 : 400;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="relative">
      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-zinc-900/80 hover:bg-zinc-900 text-white p-2 rounded-full z-10"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide space-x-4 py-4 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <motion.div
            key={event.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 w-72 cursor-pointer"
            onClick={() => handleEventClick(event.id)}
          >
            <div className="bg-zinc-800 rounded-lg overflow-hidden h-full">
              <div className="h-40 relative">
                <img
                  src={event.image || `/placeholder.svg?height=160&width=288`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs">
                  {event.genre}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold mb-2 line-clamp-1">{event.title}</h3>

                <div className="space-y-1 mb-3">
                  <div className="flex items-center text-zinc-400 text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-zinc-400 text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">
                      {event.location.venue}, {event.location.city}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">
                    ${event.price || "49.99"}
                  </span>
                  <span className="text-xs text-zinc-400">Starting from</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-zinc-900/80 hover:bg-zinc-900 text-white p-2 rounded-full z-10"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
