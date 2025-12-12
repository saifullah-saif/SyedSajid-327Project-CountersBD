"use client"

import { motion } from "framer-motion"

export default function StatsSection() {
  const stats = [
    { label: "Events Hosted", value: "10,000+" },
    { label: "Happy Customers", value: "1M+" },
    { label: "Cities", value: "50+" },
    { label: "Organizers", value: "5,000+" },
  ]

  return (
    <div className="bg-zinc-900 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-bold text-red-500 mb-2">{stat.value}</div>
              <div className="text-zinc-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
