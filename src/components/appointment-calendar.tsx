"use client"

import { useEffect, useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"

import { Calendar } from "@/components/ui/calendar"

interface AppointmentCalendarProps {
  onSelectDate: (date: Date | undefined) => void
  selectedDate: Date | undefined
}

export function AppointmentCalendar({
  onSelectDate,
  selectedDate,
}: AppointmentCalendarProps) {
  const { allAppointments: appointments } = useAppointments()
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([])

  useEffect(() => {
    const dates = appointments.map((app) => new Date(app.appointmentDate))
    setAppointmentDates(dates)
  }, [appointments])

  useEffect(() => {
    if (selectedDate) {
      const filtered = appointments.filter((app) => {
        const appDate = new Date(app.appointmentDate)
        return appDate.toDateString() === selectedDate.toDateString()
      })
      setFilteredAppointments(filtered)
    } else {
      setFilteredAppointments([])
    }
  }, [selectedDate, appointments])

  return (
    <div>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className="rounded-md border"
          modifiers={{ booked: appointmentDates }}
          modifiersStyles={{
            booked: { backgroundColor: "#00ffff33" },
          }}
        />
      </div>
      {selectedDate && (
        <div className="mt-4">
          <h1>
            <p>
              <strong>Appointments for:</strong>
            </p>
            {selectedDate.toDateString()}
          </h1>
          {filteredAppointments.length > 0 ? (
            <ul className="mt-2">
              {filteredAppointments.map((appointment) => (
                <li key={appointment.id} className="border-b py-2">
                  Time:{" "}
                  {new Date(appointment.appointmentDate).toLocaleTimeString()} -{" "}
                  {new Date(
                    appointment.appointmentEndDate
                  ).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-center">No appointments for this day.</p>
          )}
        </div>
      )}
    </div>
  )
}
