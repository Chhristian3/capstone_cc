"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Appointment = {
  id: string
  title: string
  customerName: string
  appointmentDate: string
  expirationDate: string
  description?: string
  serviceType: {
    id: string
    name: string
  }
  rating?: {
    ratingValue: string
    comment?: string
  }
}

type AppointmentContextType = {
  userAppointments: Appointment[]
  allAppointments: Appointment[]
  refreshAppointments: () => void
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined
)

export function AppointmentProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])

  const fetchUserAppointments = async () => {
    try {
      const response = await fetch("/api/appointments/user", {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch user appointments")
      }
      const data = await response.json()
      setUserAppointments(data)
    } catch (error) {
      console.error("Error fetching user appointments:", error)
    }
  }

  const fetchAllAppointments = async () => {
    try {
      const response = await fetch("/api/appointments", {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch all appointments")
      }
      const data = await response.json()
      setAllAppointments(data)
    } catch (error) {
      console.error("Error fetching all appointments:", error)
    }
  }

  useEffect(() => {
    fetchUserAppointments()
    fetchAllAppointments()
  }, [])

  const refreshAppointments = () => {
    fetchUserAppointments()
    fetchAllAppointments()
  }

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
      })
      if (!response.ok) {
        throw new Error("Failed to add appointment")
      }
      await refreshAppointments()
    } catch (error) {
      console.error("Error adding appointment:", error)
      throw error
    }
  }

  return (
    <AppointmentContext.Provider
      value={{
        userAppointments,
        allAppointments,
        refreshAppointments,
        addAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointments() {
  const context = useContext(AppointmentContext)
  if (context === undefined) {
    throw new Error(
      "useAppointments must be used within an AppointmentProvider"
    )
  }
  return context
}
