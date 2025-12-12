"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Heart } from "lucide-react";
import { useInterested } from "@/context/interested-context";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EventCard({ event }) {
  const router = useRouter();
  const { isInInterested, toggleInterested } = useInterested();
  const { data: session } = useSession();
  const user = session?.user;
  const [isHovering, setIsHovering] = useState(false);
  const { toast } = useToast();

  const isFavorite = isInInterested(event.id);

  const handleClick = () => {
    router.push(`/events/${event.id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent event card click from triggering

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add events to your interested list",
        variant: "destructive",
      });
      return;
    }

    toggleInterested(event);

    toast({
      title: isFavorite ? "Removed from interested" : "Added to interested",
      description: isFavorite
        ? `${event.title} has been removed from your interested list`
        : `${event.title} has been added to your interested list`,
      variant: isFavorite ? "default" : "success",
    });
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer relative border border-zinc-700"
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="h-40 relative">
        <img
          src={event.image || `/placeholder.svg?height=160&width=300`}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent"></div>
        <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs">
          {event.genre}
        </div>

        {/* Favorite button */}
        <button
          className={`absolute top-2 left-2 p-2 rounded-full transition-all ${
            isFavorite
              ? "bg-red-600 text-white"
              : isHovering
              ? "bg-zinc-800/80 text-white"
              : "bg-zinc-900/60 text-zinc-400"
          }`}
          onClick={handleFavoriteClick}
          aria-label={
            isFavorite ? "Remove from interested" : "Add to interested"
          }
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-xl mb-2 line-clamp-1">{event.title}</h3>

        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between">
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
          </div>

          <div className="flex items-center text-zinc-400 text-xs text-wrap">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate">
              {event.location.venue}, {event.location.city}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">৳{event.price || "49.99"}</span>
          <span className="text-xs text-zinc-400">Starting from</span>
        </div>
      </div>
    </motion.div>
  );
}
