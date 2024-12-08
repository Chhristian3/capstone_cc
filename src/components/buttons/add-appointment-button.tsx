"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppointmentCalendar } from "@/components/appointment-calendar"
import { AddAppointmentForm } from "@/components/forms/add-appointment-form"

export function AddAppointmentButton() {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Appointment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Appointment</DialogTitle>
          <DialogDescription>
            All the highlighted dates are not available for appointment
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 md:grid-cols-2">
          <AppointmentCalendar
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
          <AddAppointmentForm
            onSuccess={() => setOpen(false)}
            selectedDate={selectedDate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
