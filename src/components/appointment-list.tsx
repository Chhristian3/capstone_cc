// @ts-nocheck
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
  Star,
  StarHalf,
  CalendarPlusIcon,
  MessageSquarePlus,
  ShieldIcon,
  Loader2,
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
import { FeedbackDialog } from "@/components/feedback-dialog"
import { type Appointment, type RatingValue } from "@/contexts/AppointmentContext"
import { AddAppointmentButton } from "@/components/buttons/add-appointment-button"
import { format } from "date-fns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED"

const CANCELLATION_REASONS = [
  { id: "schedule-conflict", label: "Schedule conflict" },
  { id: "personal-emergency", label: "Personal emergency" },
  { id: "double-booked", label: "Double booked" },
  { id: "changed-mind", label: "Changed my mind" },
  { id: "other", label: "Other reason" },
] as const

type CancellationReasonId = typeof CANCELLATION_REASONS[number]["id"]

export function AppointmentList() {
  const { userAppointments: appointments, updateAppointment } = useAppointments()
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [openCancelDialogId, setOpenCancelDialogId] = useState<string | null>(null)
  const [cancellingAppointments, setCancellingAppointments] = useState<Set<string>>(new Set())
  const [completingAppointments, setCompletingAppointments] = useState<Set<string>>(new Set())
  const [feedbackAppointmentId, setFeedbackAppointmentId] = useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [appointmentToAddRemarks, setAppointmentToAddRemarks] = useState<Appointment | null>(null)
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false)
  const [userRemarks, setUserRemarks] = useState("")
  const [isAddingRemarks, setIsAddingRemarks] = useState(false)
  const [selectedReasonId, setSelectedReasonId] = useState<CancellationReasonId | null>(null)

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
    if (!appointmentToCancel || !selectedReasonId) return

    try {
      setCancellingAppointments(prev => new Set([...Array.from(prev), appointmentToCancel.id]))
      const reason = selectedReasonId === "other" ? cancellationReason : CANCELLATION_REASONS.find(r => r.id === selectedReasonId)?.label || ""
      
      const response = await fetch(`/api/appointments?id=${appointmentToCancel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appointmentToCancel,
          status: "CANCELLED",
          cancellationReason: reason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel appointment")
      }

      const updatedAppointment = await response.json()
      await updateAppointment(updatedAppointment)
      toast.success("Appointment cancelled successfully")
      setAppointmentToCancel(null)
      setOpenCancelDialogId(null)
      setCancellationReason("")
      setSelectedReasonId(null)
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      toast.error("Failed to cancel appointment")
    } finally {
      setCancellingAppointments(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointmentToCancel.id)
        return newSet
      })
    }
  }

  const handleCompleteAppointment = async (appointment: Appointment) => {
    try {
      setCompletingAppointments(prev => new Set([...Array.from(prev), appointment.id]))
      const response = await fetch(`/api/appointments?id=${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appointment,
          status: "COMPLETED",
          userRemarks,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to mark appointment as completed")
      }
      const updatedAppointment = await response.json()
      await updateAppointment(updatedAppointment)
      setAppointmentToComplete(null)
      setIsCompleteDialogOpen(false)
      setUserRemarks("")
    } catch (error) {
      console.error("Error marking appointment as completed:", error)
      toast.error("Failed to complete appointment")
    } finally {
      setCompletingAppointments(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointment.id)
        return newSet
      })
    }
  }

  const handleAddUserRemarks = async (appointment: Appointment) => {
    try {
      setIsAddingRemarks(true)
      const response = await fetch(`/api/appointments?id=${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appointment,
          userRemarks,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to add user remarks")
      }
      const updatedAppointment = await response.json()
      await updateAppointment(updatedAppointment)
      setAppointmentToAddRemarks(null)
      setIsRemarksDialogOpen(false)
      setUserRemarks("")
      toast.success("Remarks added successfully")
    } catch (error) {
      console.error("Error adding user remarks:", error)
      toast.error("Failed to add remarks")
    } finally {
      setIsAddingRemarks(false)
    }
  }

  const isAppointmentCancellable = (appointment: Appointment) => {
    return (appointment.status === "PENDING" || appointment.status === "SCHEDULED") && 
           new Date(appointment.appointmentDate) > new Date()
  }

  function getRatingValue(rating: RatingValue): number {
    switch (rating) {
      case "VeryDissatisfied":
        return 1
      case "Dissatisfied":
        return 2
      case "Neutral":
        return 3
      case "Satisfied":
        return 4
      case "VerySatisfied":
        return 5
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <AddAppointmentButton />
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
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
            <Button onClick={toggleSort} variant="outline" size="icon" className="shrink-0">
              {sortOrder === "desc" ? (
                <SortDescIcon className="h-4 w-4" />
              ) : (
                <SortAscIcon className="h-4 w-4" />
              )}
              <span className="sr-only">
                Sort {sortOrder === "desc" ? "Newest" : "Oldest"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className={`relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md ${
              appointment.status === "COMPLETED" 
                ? "border-primary/20" 
                : appointment.status === "CANCELLED"
                ? "border-destructive/20"
                : "border-border"
            }`}
          >
            <div className="flex flex-col gap-3 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium tracking-tight">{appointment.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge 
                      variant={getStatusVariant(appointment.status)} 
                      className="inline-flex items-center px-1.5 py-0 text-[11px] font-medium rounded"
                    >
                      {appointment.status === "COMPLETED" && <CheckCircleIcon className="mr-1 h-3 w-3" />}
                      {appointment.status === "SCHEDULED" && <Clock3Icon className="mr-1 h-3 w-3" />}
                      {appointment.status === "CANCELLED" && <XCircleIcon className="mr-1 h-3 w-3" />}
                      {appointment.status === "PENDING" && <Clock3Icon className="mr-1 h-3 w-3" />}
                      <span className="inline-block leading-4">{appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}</span>
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="inline-flex items-center px-1.5 py-0 text-[11px] font-medium rounded"
                    >
                      <span className="inline-block leading-4">{appointment.serviceType.name}</span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start">
                  {appointment.status === "SCHEDULED" && (
                    <Dialog open={isCompleteDialogOpen && appointmentToComplete?.id === appointment.id} onOpenChange={setIsCompleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setAppointmentToComplete(appointment)
                            setIsCompleteDialogOpen(true)
                          }}
                          disabled={completingAppointments.has(appointment.id) || new Date(appointment.appointmentDate) > new Date()}
                        >
                          {completingAppointments.has(appointment.id) ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Complete
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="mr-1 h-3 w-3" />
                              Complete
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Appointment</DialogTitle>
                          <DialogDescription>
                            Add any remarks about your completed appointment.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="remarks" className="text-sm font-medium">
                              Your Remarks
                            </label>
                            <textarea
                              id="remarks"
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter any remarks about your completed appointment..."
                              value={userRemarks}
                              onChange={(e) => setUserRemarks(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button 
                            variant="default" 
                            onClick={() => appointmentToComplete && handleCompleteAppointment(appointmentToComplete)}
                          >
                            Complete Appointment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {isAppointmentCancellable(appointment) && (
                    <Dialog 
                      open={openCancelDialogId === appointment.id} 
                      onOpenChange={(open) => {
                        if (!open) {
                          setOpenCancelDialogId(null)
                          setAppointmentToCancel(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setAppointmentToCancel(appointment)
                            setOpenCancelDialogId(appointment.id)
                          }}
                          disabled={cancellingAppointments.has(appointment.id)}
                        >
                          {cancellingAppointments.has(appointment.id) ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="mr-1 h-3 w-3" />
                              Cancel
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Cancel Appointment</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel this appointment? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <label className="text-sm font-medium">
                              Reason for cancellation <span className="text-destructive">*</span>
                            </label>
                            <RadioGroup
                              value={selectedReasonId || ""}
                              onValueChange={(value) => {
                                setSelectedReasonId(value as CancellationReasonId)
                                if (value !== "other") {
                                  setCancellationReason("")
                                }
                              }}
                              className="flex flex-col space-y-2"
                            >
                              {CANCELLATION_REASONS.map((reason) => (
                                <div key={reason.id} className="flex items-center space-x-3 py-1.5">
                                  <RadioGroupItem 
                                    value={reason.id} 
                                    id={reason.id} 
                                    className="h-4 w-4 border-primary/20 before:h-2.5 before:w-2.5 before:bg-primary" 
                                  />
                                  <Label htmlFor={reason.id} className="text-sm text-muted-foreground cursor-pointer">
                                    {reason.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                            {selectedReasonId === "other" && (
                              <div className="space-y-2 pt-2 pl-7">
                                <textarea
                                  id="custom-reason"
                                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Please provide a reason for cancelling this appointment..."
                                  value={cancellationReason}
                                  onChange={(e) => setCancellationReason(e.target.value)}
                                  required
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                              No, Keep it
                            </Button>
                          </DialogClose>
                          <Button 
                            variant="destructive" 
                            onClick={handleCancelAppointment}
                            disabled={!selectedReasonId || (selectedReasonId === "other" && !cancellationReason.trim()) || cancellingAppointments.has(appointmentToCancel?.id || "")}
                            className="w-full sm:w-auto"
                          >
                            {cancellingAppointments.has(appointmentToCancel?.id || "") ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              "Yes, Cancel Appointment"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Date & Time</p>
                      <p className="text-xs">
                        {format(new Date(appointment.appointmentDate), "PPP")} at{" "}
                        {format(new Date(appointment.appointmentDate), "p")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <UserIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Customer</p>
                      <p className="text-xs">{appointment.customerName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <Clock3Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Duration</p>
                      <p className="text-xs">
                        {Math.round((new Date(appointment.appointmentEndDate).getTime() - new Date(appointment.appointmentDate).getTime()) / (1000 * 60))} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <CalendarPlusIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Created</p>
                      <p className="text-xs">
                        {format(new Date(appointment.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {appointment.description && (
                <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">{appointment.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <FeedbackDialog
        appointmentId={feedbackAppointmentId || ""}
        isOpen={!!feedbackAppointmentId}
        onOpenChange={(open) => !open && setFeedbackAppointmentId(null)}
      />
    </div>
  )
}
