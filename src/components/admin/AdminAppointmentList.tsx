"use client"

import { useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import { format } from "date-fns"
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  FilterIcon,
  SearchIcon,
  UserIcon,
  CheckIcon,
  XCircleIcon,
  Star,
  Clock3Icon,
  CalendarPlusIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { type Appointment, type RatingValue } from "@/contexts/AppointmentContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DialogClose,
} from "@/components/ui/dialog"

type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc"
type FilterOption = "all" | "pending" | "scheduled" | "completed" | "cancelled"

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

export function AdminAppointmentList() {
  const { allAppointments, refreshAppointments, updateAppointment } = useAppointments()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")
  const [filterOption, setFilterOption] = useState<FilterOption>("all")
  const [completingAppointments, setCompletingAppointments] = useState<Set<string>>(new Set())
  const [approvingAppointments, setApprovingAppointments] = useState<Set<string>>(new Set())
  const [cancellingAppointments, setCancellingAppointments] = useState<Set<string>>(new Set())
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")

  const markAppointmentCompleted = async (appointmentId: string) => {
    try {
      setCompletingAppointments(prev => new Set([...Array.from(prev), appointmentId]))
      const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
        method: "PUT",
      })
      if (!response.ok) {
        throw new Error("Failed to mark appointment as completed")
      }
      await refreshAppointments()
    } catch (error) {
      console.error("Error marking appointment as completed:", error)
    } finally {
      setCompletingAppointments(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointmentId)
        return newSet
      })
    }
  }

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      setApprovingAppointments(prev => new Set([...Array.from(prev), appointmentId]))
      const appointment = allAppointments.find(a => a.id === appointmentId)
      if (!appointment) return

      await updateAppointment({
        ...appointment,
        status: "SCHEDULED"
      })
      await refreshAppointments()
    } catch (error) {
      console.error("Error approving appointment:", error)
    } finally {
      setApprovingAppointments(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointmentId)
        return newSet
      })
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel || !cancellationReason) return

    try {
      setCancellingAppointments(prev => new Set([...Array.from(prev), appointmentToCancel.id]))
      const response = await fetch(`/api/appointments?id=${appointmentToCancel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appointmentToCancel,
          status: "CANCELLED",
          cancellationReason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel appointment")
      }

      await refreshAppointments()
      setAppointmentToCancel(null)
      setIsCancelDialogOpen(false)
      setCancellationReason("")
    } catch (error) {
      console.error("Error cancelling appointment:", error)
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

  const filteredAndSortedAppointments = allAppointments
    .filter((appointment) => {
      // Filter by search query
      const matchesSearch =
        appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.customerName.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by status
      switch (filterOption) {
        case "pending":
          return matchesSearch && appointment.status === "PENDING"
        case "scheduled":
          return matchesSearch && appointment.status === "SCHEDULED"
        case "completed":
          return matchesSearch && appointment.status === "COMPLETED"
        case "cancelled":
          return matchesSearch && appointment.status === "CANCELLED"
        default:
          return matchesSearch
      }
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "date-asc":
          return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
        case "date-desc":
          return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        case "name-asc":
          return a.customerName.localeCompare(b.customerName)
        case "name-desc":
          return b.customerName.localeCompare(a.customerName)
        default:
          return 0
      }
    })

  const getAppointmentStatus = (appointment: Appointment) => {
    switch (appointment.status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>
      case "SCHEDULED":
        return <Badge variant="secondary">Scheduled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
              <SelectItem value="date-desc">Date (Newest first)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOption} onValueChange={(value) => setFilterOption(value as FilterOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All appointments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {!allAppointments.length ? (
          <>
            <Card className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-5 w-[100px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : filteredAndSortedAppointments.map((appointment) => (
          <Card 
            key={appointment.id} 
            className={`relative overflow-hidden transition-shadow hover:shadow-md ${
              appointment.status === "COMPLETED" 
                ? "border-primary/20 bg-primary/5" 
                : appointment.status === "CANCELLED"
                ? "border-destructive/20 bg-destructive/5"
                : ""
            }`}
          >
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{appointment.title}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={getStatusVariant(appointment.status)} className="h-5">
                      {appointment.status === "COMPLETED" && <CheckCircleIcon className="mr-1 h-3 w-3" />}
                      {appointment.status === "SCHEDULED" && <Clock3Icon className="mr-1 h-3 w-3" />}
                      {appointment.status === "CANCELLED" && <XCircleIcon className="mr-1 h-3 w-3" />}
                      {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                    </Badge>
                    <Badge variant="outline" className="h-5 font-normal">
                      {appointment.serviceType.name}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {appointment.status === "PENDING" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveAppointment(appointment.id)}
                      disabled={approvingAppointments.has(appointment.id)}
                    >
                      {approvingAppointments.has(appointment.id) ? (
                        <>
                          <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
                          Approve
                        </>
                      )}
                    </Button>
                  )}
                  {appointment.status === "SCHEDULED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAppointmentCompleted(appointment.id)}
                      disabled={completingAppointments.has(appointment.id)}
                    >
                      {completingAppointments.has(appointment.id) ? (
                        <>
                          <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" />
                          Complete
                        </>
                      )}
                    </Button>
                  )}
                  {isAppointmentCancellable(appointment) && (
                    <Dialog open={isCancelDialogOpen && appointmentToCancel?.id === appointment.id} onOpenChange={setIsCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setAppointmentToCancel(appointment)
                            setIsCancelDialogOpen(true)
                          }}
                          disabled={cancellingAppointments.has(appointment.id)}
                        >
                          {cancellingAppointments.has(appointment.id) ? (
                            <>
                              <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="mr-1.5 h-3.5 w-3.5" />
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
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="reason" className="text-sm font-medium">
                              Reason for cancellation <span className="text-destructive">*</span>
                            </label>
                            <textarea
                              id="reason"
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Please provide a reason for cancelling this appointment..."
                              value={cancellationReason}
                              onChange={(e) => setCancellationReason(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                              No, Keep it
                            </Button>
                          </DialogClose>
                          <Button 
                            variant="destructive" 
                            onClick={handleCancelAppointment}
                            disabled={!cancellationReason.trim()}
                          >
                            Yes, Cancel Appointment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">               
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>Date</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(appointment.appointmentDate), "PPP")}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>Time</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(appointment.appointmentDate), "p")}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Customer</span>
                  </div>
                  <p className="text-sm font-medium">{appointment.customerName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3Icon className="h-3.5 w-3.5" />
                    <span>Duration</span>
                  </div>
                  <p className="text-sm font-medium">
                    {Math.round((new Date(appointment.appointmentEndDate).getTime() - new Date(appointment.appointmentDate).getTime()) / (1000 * 60))} minutes
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarPlusIcon className="h-3.5 w-3.5" />
                    <span>Created</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(appointment.createdAt), "PPP")}
                  </p>
                </div>
              </div>
              {appointment.description && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Notes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.description}
                  </p>
                </div>
              )}
              {appointment.status === "COMPLETED" && appointment.rating && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span>Customer Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`h-3.5 w-3.5 ${
                            value <= getRatingValue(appointment.rating!.ratingValue)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="outline" className="h-5 font-normal">
                      {appointment.rating.ratingValue}
                    </Badge>
                    {appointment.rating.comment && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {appointment.status === "CANCELLED" && appointment.cancellationReason && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Cancellation Reason</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.cancellationReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 