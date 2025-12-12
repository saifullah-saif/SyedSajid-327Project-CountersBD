"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin } from "lucide-react";

export default function EventGrid({ events }) {
  const router = useRouter();

  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {events.map((event) => (
        <motion.div
          key={event.id}
          variants={item}
          whileHover={{ y: -5 }}
          className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => handleEventClick(event.id)}
        >
          <div className="h-40 relative">
            <img
              src={event.image || `/placeholder.svg?height=160&width=300`}
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
                <Clock className="h-3 w-3 mr-1" />
                <span>{event.time || "7:00 PM"}</span>
              </div>
              <div className="flex items-center text-zinc-400 text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">
                  {event.location.venue}, {event.location.city}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
