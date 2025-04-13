"use client"

import { useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import {
  CalendarIcon,
  ClockIcon,
  SortAscIcon,
  SortDescIcon,
  UserIcon,
  CheckCircleIcon,
  Clock3Icon,
  XCircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED"

type Appointment = {
  id: string
  title: string
  customerName: string
  appointmentDate: string
  appointmentEndDate: string
  expirationDate: string
  description?: string
  status: AppointmentStatus
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
  const { userAppointments: appointments, updateAppointment } = useAppointments()
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cancellingAppointments, setCancellingAppointments] = useState<Set<string>>(new Set())

  const filteredAndSortedAppointments = [...appointments]
    .filter((appointment) => statusFilter === "all" || appointment.status === statusFilter)
    .sort((a, b) => {
      if (sortOrder === "desc") {
        return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      } else {
        return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      }
    })

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
  }

  const getStatusVariant = (status: AppointmentStatus): "default" | "destructive" | "secondary" => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return

    try {
      setCancellingAppointments(prev => new Set([...Array.from(prev), appointmentToCancel.id]))
      await updateAppointment({
        ...appointmentToCancel,
        status: "CANCELLED"
      })
      toast.success("Appointment cancelled successfully")
      setAppointmentToCancel(null)
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Failed to cancel appointment")
    } finally {
      setCancellingAppointments(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointmentToCancel.id)
        return newSet
      })
    }
  }

  const isAppointmentCancellable = (appointment: Appointment) => {
    return (appointment.status === "PENDING" || appointment.status === "SCHEDULED") && 
           new Date(appointment.appointmentDate) > new Date()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={toggleSort} variant="outline" size="sm">
            {sortOrder === "desc" ? (
              <SortDescIcon className="mr-2 h-4 w-4" />
            ) : (
              <SortAscIcon className="mr-2 h-4 w-4" />
            )}
            Sort {sortOrder === "desc" ? "Newest" : "Oldest"}
          </Button>
        </div>
      </div>

      {filteredAndSortedAppointments.map((appointment: Appointment) => (
        <Card 
          key={appointment.id}
          className={appointment.status === "COMPLETED" ? "border-primary/20 bg-primary/5" : ""}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{appointment.title}</span>
                <Badge variant={getStatusVariant(appointment.status)}>
                  {appointment.status === "COMPLETED" && <CheckCircleIcon className="mr-1 h-3 w-3" />}
                  {appointment.status === "SCHEDULED" && <Clock3Icon className="mr-1 h-3 w-3" />}
                  {appointment.status === "CANCELLED" && <XCircleIcon className="mr-1 h-3 w-3" />}
                  {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{appointment.serviceType.name}</Badge>
                {isAppointmentCancellable(appointment) && (
                  <Dialog open={isDialogOpen && appointmentToCancel?.id === appointment.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setAppointmentToCancel(appointment)
                          setIsDialogOpen(true)
                        }}
                        disabled={cancellingAppointments.has(appointment.id)}
                      >
                        {cancellingAppointments.has(appointment.id) ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="mr-2 h-4 w-4" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Appointment</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel this appointment? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            No, Keep it
                          </Button>
                        </DialogClose>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelAppointment}
                        >
                          Yes, Cancel Appointment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
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
