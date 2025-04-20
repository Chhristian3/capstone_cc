// @ts-nocheck
import React from "react"
import { CalendarIcon, ClockIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface AppointmentDialogProps {
  date: Date
  onClose: () => void
  appointments: Array<{
    id: string
    appointmentDate: string
    endTime: string
  }>
}

export function AppointmentDialog({
  date,
  onClose,
  appointments,
}: AppointmentDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="overflow-y-auto sm:max-h-[600px] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Booked Times for {date.toDateString()}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full overflow-y-auto rounded-md border p-4">
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(appointment.appointmentEndDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-foreground">No appointments for this date.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
