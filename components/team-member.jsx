"use client"

import { motion } from "framer-motion"
import { Twitter, Linkedin, Mail } from "lucide-react"

export default function TeamMember({ member }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
      <div className="h-64 relative">
        <img
          src={member.image || `/placeholder.svg?height=256&width=256&text=${member.name}`}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg">{member.name}</h3>
        <p className="text-zinc-400 text-sm mb-3">{member.position}</p>
        <p className="text-zinc-300 text-sm mb-4">{member.bio}</p>
        <div className="flex space-x-3">
          {member.twitter && (
            <a
              href={member.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-zinc-700 rounded-full hover:bg-zinc-600 transition-colors"
            >
              <Twitter size={16} />
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-zinc-700 rounded-full hover:bg-zinc-600 transition-colors"
            >
              <Linkedin size={16} />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="p-2 bg-zinc-700 rounded-full hover:bg-zinc-600 transition-colors"
            >
              <Mail size={16} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
