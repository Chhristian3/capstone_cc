"use client"

import { useEffect, useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"

import { Calendar } from "@/components/ui/calendar"

interface AppointmentCalendarProps {
  onSelectDate: (date: Date | undefined) => void
}

export function AppointmentCalendar({
  onSelectDate,
}: AppointmentCalendarProps) {
  const { allAppointments: appointments } = useAppointments()
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([])

  useEffect(() => {
    const dates = appointments.map((app) => new Date(app.appointmentDate))
    setAppointmentDates(dates)
  }, [appointments])

  // Disable booked dates
  const isDateDisabled = (date: Date) => {
    return appointmentDates.some(
      (appointmentDate) =>
        appointmentDate.toDateString() === date.toDateString()
    )
  }

  return (
    <Calendar
      mode="single"
      selected={undefined}
      onSelect={onSelectDate}
      className="rounded-md border"
      disabled={isDateDisabled} // Pass the function to disable booked dates
      modifiers={{ booked: appointmentDates }}
      modifiersStyles={{
        booked: { backgroundColor: "#00ffff33" },
      }}
    />
  )
}
