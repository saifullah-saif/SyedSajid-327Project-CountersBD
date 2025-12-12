"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Music, Trophy, Palette, Laugh, Users, Utensils, Baby, Tent } from "lucide-react"

export default function GenreCarousel({ genres }) {
  const router = useRouter()
  const carouselRef = useRef(null)

  const handleGenreClick = (genre) => {
    router.push(`/events?genre=${genre}`)
  }

  // Auto-scrolling effect
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    let scrollInterval
    let isPaused = false

    // Start auto-scrolling
    const startScrolling = () => {
      scrollInterval = setInterval(() => {
        if (carousel && !isPaused) {
          // If we've scrolled to the end, reset to the beginning
          if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 10) {
            carousel.scrollLeft = 0
          } else {
            carousel.scrollLeft += 1 // Smooth scrolling speed
          }
        }
      }, 20) // Adjust timing for smoother or faster scrolling
    }

    startScrolling()

    // Pause scrolling when user interacts
    const handleMouseEnter = () => {
      isPaused = true
    }
    const handleMouseLeave = () => {
      isPaused = false
    }
    const handleTouchStart = () => {
      isPaused = true
    }
    const handleTouchEnd = () => {
      isPaused = false
    }

    carousel.addEventListener("mouseenter", handleMouseEnter)
    carousel.addEventListener("mouseleave", handleMouseLeave)
    carousel.addEventListener("touchstart", handleTouchStart)
    carousel.addEventListener("touchend", handleTouchEnd)

    // Clean up
    return () => {
      clearInterval(scrollInterval)
      if (carousel) {
        carousel.removeEventListener("mouseenter", handleMouseEnter)
        carousel.removeEventListener("mouseleave", handleMouseLeave)
        carousel.removeEventListener("touchstart", handleTouchStart)
        carousel.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [])

  // Map genre names to icons
  const getGenreIcon = (genreName) => {
    switch (genreName.toLowerCase()) {
      case "music":
        return <Music className="h-10 w-10 transition-colors duration-300 group-hover:text-red-500" />
      case "sports":
        return <Trophy className="h-10 w-10 transition-colors duration-300 group-hover:text-blue-500" />
      case "arts":
        return <Palette className="h-10 w-10 transition-colors duration-300 group-hover:text-purple-500" />
      case "comedy":
        return <Laugh className="h-10 w-10 transition-colors duration-300 group-hover:text-yellow-500" />
      case "conference":
        return <Users className="h-10 w-10 transition-colors duration-300 group-hover:text-green-500" />
      case "food":
        return <Utensils className="h-10 w-10 transition-colors duration-300 group-hover:text-orange-500" />
      case "family":
        return <Baby className="h-10 w-10 transition-colors duration-300 group-hover:text-pink-500" />
      case "festival":
        return <Tent className="h-10 w-10 transition-colors duration-300 group-hover:text-teal-500" />
      default:
        return <Music className="h-10 w-10 transition-colors duration-300 group-hover:text-red-500" />
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide space-x-8 py-6 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Duplicate the genres array to create a seamless loop effect */}
        {[...genres, ...genres].map((genre, index) => (
          <motion.div
            key={`${genre.id}-${index}`}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 cursor-pointer group flex flex-col items-center"
            onClick={() => handleGenreClick(genre.name)}
          >
            <div className="text-zinc-400 mb-2">{getGenreIcon(genre.name)}</div>
            <h3 className="text-white text-sm font-medium">{genre.name}</h3>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
