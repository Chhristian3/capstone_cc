"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type RatingValue = "VeryDissatisfied" | "Dissatisfied" | "Neutral" | "Satisfied" | "VerySatisfied"
export type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED"

export interface ServiceType {
  id: string
  name: string
}

export interface Rating {
  ratingValue: RatingValue
  comment?: string
}

export interface Appointment {
  id: string
  userId: string
  title: string
  customerName: string
  appointmentDate: string
  appointmentEndDate: string
  expirationDate: string
  serviceTypeId: string
  serviceType: ServiceType
  description?: string
  status: AppointmentStatus
  rating?: Rating
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

type AppointmentContextType = {
  userAppointments: Appointment[]
  allAppointments: Appointment[]
  refreshAppointments: () => void
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>
  updateAppointment: (appointment: Appointment) => Promise<void>
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
        const errorData = await response.json()
        throw errorData
      }
      
      await refreshAppointments()
    } catch (error) {
      console.error("Error adding appointment:", error)
      throw error
    }
  }

  const updateAppointment = async (appointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments?id=${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
      })
      if (!response.ok) {
        throw new Error("Failed to update appointment")
      }
      await refreshAppointments()
    } catch (error) {
      console.error("Error updating appointment:", error)
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
        updateAppointment,
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
