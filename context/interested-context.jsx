"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { useSession } from "next-auth/react";
const InterestedContext = createContext(null)

export const InterestedProvider = ({ children }) => {
  const [interested, setInterested] = useState([])
  const { data: session } = useSession();
  const user = session?.user; 

  // Load interested from localStorage when component mounts or user changes
  useEffect(() => {
    if (user) {
      const storedInterested = localStorage.getItem(`interested-${user.email}`)
      if (storedInterested) {
        setInterested(JSON.parse(storedInterested))
      }
    } else {
      setInterested([])
    }
  }, [user])

  // Save interested to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`interested-${user.email}`, JSON.stringify(interested))
    }
  }, [interested, user])

  const addToInterested = (event) => {
    if (!user) return false

    if (!isInInterested(event.id)) {
      setInterested([...interested, event])
      return true
    }
    return false
  }

  const removeFromInterested = (eventId) => {
    if (!user) return false

    setInterested(interested.filter((event) => event.id !== eventId))
    return true
  }

  const toggleInterested = (event) => {
    if (!user) return false

    if (isInInterested(event.id)) {
      removeFromInterested(event.id)
    } else {
      addToInterested(event)
    }
    return true
  }

  const isInInterested = (eventId) => {
    return interested.some((event) => event.id === eventId)
  }

  return (
    <InterestedContext.Provider
      value={{
        interested,
        addToInterested,
        removeFromInterested,
        toggleInterested,
        isInInterested,
      }}
    >
      {children}
    </InterestedContext.Provider>
  )
}

export const useInterested = () => useContext(InterestedContext)
