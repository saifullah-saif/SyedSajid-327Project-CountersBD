"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"

export default function Testimonial({ testimonial }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-zinc-800 rounded-lg p-6 border border-zinc-700 relative">
      <Quote className="absolute top-4 right-4 text-zinc-700" size={24} />
      <p className="text-zinc-300 mb-4 italic">{testimonial.quote}</p>
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
          <img
            src={testimonial.avatar || `/placeholder.svg?height=48&width=48&text=${testimonial.name.charAt(0)}`}
            alt={testimonial.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="font-bold">{testimonial.name}</h4>
          <p className="text-zinc-400 text-sm">{testimonial.position}</p>
        </div>
      </div>
    </motion.div>
  )
}
