"use client"

import { useEffect, useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import { Calendar } from "@/components/ui/calendar"
import { DateStatus } from "@prisma/client"
import { toast } from "sonner"

interface SelectedDate {
  id: string
  date: string
  status: DateStatus
  startTime: string | null
  endTime: string | null
  reason: string | null
}

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
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])

  // Fetch selected dates from API
  useEffect(() => {
    const fetchSelectedDates = async () => {
      try {
        const response = await fetch("/api/settings/date")
        const data = await response.json()
        setSelectedDates(data)
      } catch (error) {
        toast.error("Failed to fetch date settings")
      }
    }
    fetchSelectedDates()
  }, [])

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

  const disabledDates = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    maxDate.setHours(23, 59, 59, 999)

    // Check if date is in the past or more than 30 days in the future
    if (date < today || date > maxDate) {
      return true
    }

    // Check if date is disabled in selected dates
    const selectedDate = selectedDates.find(
      (sd) => new Date(sd.date).toDateString() === date.toDateString()
    )
    return selectedDate?.status === DateStatus.DISABLED
  }

  const getDisabledDateMessage = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    maxDate.setHours(23, 59, 59, 999)

    if (date < today) {
      return "Cannot select past dates"
    }
    if (date > maxDate) {
      return "Cannot select dates more than 30 days in advance"
    }

    const selectedDate = selectedDates.find(
      (sd) => new Date(sd.date).toDateString() === date.toDateString()
    )
    if (selectedDate?.status === DateStatus.DISABLED) {
      return selectedDate.reason || "This date is disabled for appointments"
    }

    return ""
  }

  return (
    <div>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className="rounded-md border"
          modifiers={{ 
            booked: appointmentDates,
            disabled: selectedDates
              .filter((sd) => sd.status === DateStatus.DISABLED)
              .map((sd) => new Date(sd.date))
          }}
          modifiersStyles={{
            booked: { backgroundColor: "#00ffff33" },
            disabled: { backgroundColor: "#ff000033" }
          }}
          disabled={disabledDates}
          onDayClick={(day) => {
            if (disabledDates(day)) {
              const message = getDisabledDateMessage(day)
              if (message) {
                toast.error(message)
              }
            }
          }}
        />
      </div>
      <div className="mt-2 text-center text-sm text-muted-foreground">
        <p>Dates in the past, more than 30 days in the future, and disabled dates are not selectable</p>
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
