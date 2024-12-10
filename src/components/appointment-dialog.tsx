import React from "react"
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react"

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
    title: string
    customerName: string
    appointmentDate: string
    serviceType: { name: string }
    description?: string
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
          <DialogTitle>Appointments for {date.toDateString()}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full overflow-y-auto rounded-md border p-4">
          {appointments.length > 0 ? (
            appointments.map((appointment, index) => (
              <React.Fragment key={appointment.id}>
                {index > 0 && <Separator className="my-4" />}
                <div>
                  <h3 className="font-semibold">{appointment.title}</h3>
                  <Separator className="my-2" />
                  <div className="mt-1 flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 opacity-70" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 opacity-70" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 opacity-70" />
                    <span className="text-sm text-muted-foreground">
                      {appointment.customerName}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <p className="mt-1">
                    Service: {appointment.serviceType.name}
                  </p>
                  {appointment.description && (
                    <>
                      <Separator className="my-2" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Client Instruction: {appointment.description}
                      </p>
                    </>
                  )}
                </div>
              </React.Fragment>
            ))
          ) : (
            <p>No appointments for this date.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
