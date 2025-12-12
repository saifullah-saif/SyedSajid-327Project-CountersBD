"use client"

import { useState } from "react"

export default function FilterSection({ onFilterChange }) {
  const [filters, setFilters] = useState({
    genre: "all",
    location: "all",
    date: "",
  })

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const locations = ["All Locations", "New York", "Los Angeles", "Chicago", "Miami", "Austin", "Seattle"]
  const genres = ["All Genres", "Music", "Sports", "Arts", "Comedy", "Conference", "Food", "Family", "Festival"]
  const dates = [
    { value: "", label: "Any Date" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ]

  return null
}
