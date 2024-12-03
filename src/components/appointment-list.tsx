"use client"

import { useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import {
  CalendarIcon,
  ClockIcon,
  SortAscIcon,
  SortDescIcon,
  UserIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Appointment = {
  id: string
  title: string
  customerName: string
  appointmentDate: string
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

export function AppointmentList() {
  const { userAppointments: appointments } = useAppointments()
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const sortedAppointments = [...appointments].sort((a, b) => {
    if (sortOrder === "desc") {
      return (
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
      )
    } else {
      return (
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
      )
    }
  })

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <Button onClick={toggleSort} variant="outline" size="sm">
          {sortOrder === "desc" ? (
            <SortDescIcon className="mr-2 h-4 w-4" />
          ) : (
            <SortAscIcon className="mr-2 h-4 w-4" />
          )}
          Sort {sortOrder === "desc" ? "Newest" : "Oldest"}
        </Button>
      </div>
      {sortedAppointments.map((appointment: Appointment) => (
        <Card key={appointment.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{appointment.title}</span>
              <Badge>{appointment.serviceType.name}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 opacity-70" />
                <span className="text-sm text-muted-foreground">
                  {new Date(appointment.appointmentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 opacity-70" />
                <span className="text-sm text-muted-foreground">
                  {new Date(appointment.appointmentDate).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 opacity-70" />
                <span className="text-sm text-muted-foreground">
                  {appointment.customerName}
                </span>
              </div>
            </div>
            <Separator className="my-2" />
            {appointment.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {appointment.description}
              </p>
            )}
            {appointment.rating && (
              <>
                <Separator className="my-2" />
                <div className="mt-2">
                  <Badge variant="outline">
                    Rating: {appointment.rating.ratingValue}
                  </Badge>
                  {appointment.rating.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.rating.comment}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
