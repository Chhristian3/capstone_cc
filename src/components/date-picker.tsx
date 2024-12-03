"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  onSelect: (date: Date | undefined) => void
  bookedDates?: Date[]
}

export function DatePicker({ onSelect, bookedDates = [] }: DatePickerProps) {
  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) => bookedDate.toDateString() === date.toDateString()
    )
  }

  return (
    <Calendar
      mode="single"
      selected={undefined}
      onSelect={onSelect}
      className="rounded-md border"
      modifiers={{ booked: isDateBooked }}
      modifiersStyles={{
        booked: { backgroundColor: "#13ffff33" },
      }}
    />
  )
}
