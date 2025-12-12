"use client"

import { motion } from "framer-motion"
import { Shield, Ticket, CreditCard, Clock } from "lucide-react"

export default function Benefits() {
  const benefits = [
    {
      icon: <Shield className="h-10 w-10 text-red-500" />,
      title: "Secure Transactions",
      description: "All payments are processed securely with industry-standard encryption.",
    },
    {
      icon: <Ticket className="h-10 w-10 text-red-500" />,
      title: "Instant Tickets",
      description: "Get your e-tickets instantly after purchase, no waiting required.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-red-500" />,
      title: "Multiple Payment Options",
      description: "Pay with credit card, debit card, or other popular payment methods.",
    },
    {
      icon: <Clock className="h-10 w-10 text-red-500" />,
      title: "24/7 Customer Support",
      description: "Our support team is available around the clock to assist you.",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <section className="my-12 py-12 border-t border-zinc-800">
      <h2 className="text-2xl font-bold mb-8 text-center">Why Choose Counters</h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {benefits.map((benefit, index) => (
          <motion.div key={index} variants={item} className="bg-zinc-800 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">{benefit.icon}</div>
            <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
            <p className="text-zinc-400 text-sm">{benefit.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
