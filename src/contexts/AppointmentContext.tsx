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
  appointments: Appointment[]
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
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to fetch appointments")
      }
      const data = await response.json()
      setAppointments(data)
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const refreshAppointments = () => {
    fetchAppointments()
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
      await fetchAppointments()
    } catch (error) {
      console.error("Error adding appointment:", error)
      throw error
    }
  }

  return (
    <AppointmentContext.Provider
      value={{ appointments, refreshAppointments, addAppointment }}
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
