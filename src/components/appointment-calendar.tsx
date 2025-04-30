"use client"

import { useEffect, useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import { Calendar } from "@/components/ui/calendar"
import { DateStatus } from "@prisma/client"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

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

  // Modifier for out-of-range dates (past or >30 days future)
  const outOfRangeDates = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date()
    maxDate.setDate(today.getDate() + 30)
    maxDate.setHours(23, 59, 59, 999)
    return date < today || date > maxDate
  }

  // Only disable dates from selectedDates with status DISABLED
  const disabledDates = (date: Date) => {
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
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-[350px] space-y-4">
        <div className="flex items-center justify-between px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted"
            onClick={() => {
              const prevMonth = new Date(currentMonth)
              prevMonth.setMonth(prevMonth.getMonth() - 1)
              if (prevMonth >= new Date()) {
                setCurrentMonth(prevMonth)
              }
            }}
            disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth()) <= new Date(new Date().getFullYear(), new Date().getMonth())}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <h2 className="text-sm font-medium px-4">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted"
            onClick={() => {
              const nextMonth = new Date(currentMonth)
              nextMonth.setMonth(nextMonth.getMonth() + 1)
              const maxDate = new Date()
              maxDate.setMonth(maxDate.getMonth() + 6)
              if (nextMonth <= maxDate) {
                setCurrentMonth(nextMonth)
              }
            }}
            disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth()) >= new Date(new Date().getFullYear(), new Date().getMonth() + 6)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={date => {
            if (date && !disabledDates(date) && !outOfRangeDates(date)) {
              onSelectDate(date)
            }
          }}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          showOutsideDays={true}
          className="rounded-lg border shadow-sm bg-card p-3"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "grid grid-cols-7 mb-1",
            head_cell: "text-muted-foreground text-[0.8rem] font-medium text-center",
            row: "grid grid-cols-7 mt-2",
            cell: "text-center p-0",
            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground mx-auto flex items-center justify-center rounded-md",
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          modifiers={{ 
            booked: appointmentDates,
            disabled: selectedDates
              .filter((sd) => sd.status === DateStatus.DISABLED)
              .map((sd) => new Date(sd.date)),
            outOfRange: outOfRangeDates
          }}
          modifiersClassNames={{
            outOfRange: "text-muted-foreground opacity-50"
          }}
          modifiersStyles={{
            booked: { 
              backgroundColor: "rgb(var(--primary) / 0.1)",
              color: "rgb(var(--primary))",
              fontWeight: "500"
            },
            disabled: { 
              backgroundColor: "rgb(var(--destructive) / 0.1)",
              color: "rgb(var(--destructive))",
              textDecoration: "line-through"
            }
          }}
          disabled={disabledDates}
          onDayClick={(day) => {
            if (disabledDates(day) || outOfRangeDates(day)) {
              const message = getDisabledDateMessage(day)
              if (message) {
                toast.error(message)
              }
            }
          }}
          fromMonth={new Date()}
          toMonth={(() => {
            const maxDate = new Date()
            maxDate.setMonth(maxDate.getMonth() + 6)
            return maxDate
          })()}
          components={{
            Caption: () => null
          }}
        />

        <div className="rounded-lg border bg-card p-3 space-y-2">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary/10"></span>
              Available dates with existing appointments
            </p>
            <p className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-destructive/10"></span>
              Disabled dates
            </p>
            <p className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-muted"></span>
              Past dates and dates beyond 30 days
            </p>
          </div>
          <p className="text-[11px] text-center text-muted-foreground italic pt-1">
            You can navigate through months but can only select dates within the next 30 days
          </p>
        </div>
      </div>

      {selectedDate && (
        <div className="w-full max-w-[350px] rounded-lg border p-4 bg-card">
          <h2 className="font-medium mb-2">
            Selected Date: {selectedDate.toDateString()}
          </h2>
          {filteredAppointments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">Existing appointments:</p>
              <ul className="space-y-2">
                {filteredAppointments.map((appointment) => (
                  <li key={appointment.id} className="text-sm flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span>
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(appointment.appointmentEndDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No appointments scheduled for this day.</p>
          )}
        </div>
      )}
    </div>
  )
}
