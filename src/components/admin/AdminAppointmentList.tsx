// @ts-nocheck
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
  MessageSquarePlus,
  ShieldIcon,
  Loader2,
  CreditCard,
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
type SentimentFilter = "all" | "very_positive" | "positive" | "neutral" | "negative" | "very_negative"

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
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all")
  const [completingAppointments, setCompletingAppointments] = useState<Set<string>>(new Set())
  const [approvingAppointments, setApprovingAppointments] = useState<Set<string>>(new Set())
  const [cancellingAppointments, setCancellingAppointments] = useState<Set<string>>(new Set())
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [appointmentToAddRemarks, setAppointmentToAddRemarks] = useState<Appointment | null>(null)
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false)
  const [adminRemarks, setAdminRemarks] = useState("")
  const [isAddingRemarks, setIsAddingRemarks] = useState(false)

  const markAppointmentCompleted = async (appointment: Appointment) => {
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
          adminRemarks,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to mark appointment as completed")
      }
      await refreshAppointments()
      setAppointmentToComplete(null)
      setIsCompleteDialogOpen(false)
      setAdminRemarks("")
    } catch (error) {
      console.error("Error marking appointment as completed:", error)
    } finally {
      setCompletingAppointments(prev => {
        const newSet = new Set(prev)
        newSet.delete(appointment.id)
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

  const handleAddAdminRemarks = async (appointment: Appointment) => {
    try {
      setIsAddingRemarks(true)
      const response = await fetch(`/api/appointments?id=${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appointment,
          adminRemarks,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to add admin remarks")
      }
      await refreshAppointments()
      setAppointmentToAddRemarks(null)
      setIsRemarksDialogOpen(false)
      setAdminRemarks("")
    } catch (error) {
      console.error("Error adding admin remarks:", error)
    } finally {
      setIsAddingRemarks(false)
    }
  }

  const isAppointmentCancellable = (appointment: Appointment) => {
    return (appointment.status === "PENDING" || appointment.status === "SCHEDULED") && 
           new Date(appointment.appointmentDate) > new Date()
  }

  const getSentimentColor = (category: string) => {
    switch (category) {
      case "VERY_POSITIVE":
        return "bg-green-600"
      case "POSITIVE":
        return "bg-green-500"
      case "NEUTRAL":
        return "bg-gray-500"
      case "NEGATIVE":
        return "bg-yellow-500"
      case "VERY_NEGATIVE":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getSentimentLabel = (category: string) => {
    switch (category) {
      case "VERY_POSITIVE":
        return "Very Positive"
      case "POSITIVE":
        return "Positive"
      case "NEUTRAL":
        return "Neutral"
      case "NEGATIVE":
        return "Negative"
      case "VERY_NEGATIVE":
        return "Very Negative"
      default:
        return "No Sentiment"
    }
  }

  const filteredAndSortedAppointments = allAppointments
    .filter((appointment) => {
      // Filter by search query
      const matchesSearch =
        appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.customerName.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by status
      const matchesStatus = filterOption === "all" || appointment.status === filterOption.toUpperCase()

      // Filter by sentiment
      const matchesSentiment = sentimentFilter === "all" || 
        (appointment.rating?.sentimentCategory?.toLowerCase() === sentimentFilter)

      return matchesSearch && matchesStatus && matchesSentiment
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
          <Select value={sentimentFilter} onValueChange={(value) => setSentimentFilter(value as SentimentFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sentiments</SelectItem>
              <SelectItem value="very_positive">Very Positive</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="very_negative">Very Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {!allAppointments.length ? (
          <div className="animate-pulse rounded-xl border bg-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-2">
                <div className="h-5 w-[200px] rounded bg-muted" />
                <div className="h-4 w-[150px] rounded bg-muted" />
              </div>
              <div className="h-5 w-[100px] rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-[250px] rounded bg-muted" />
              <div className="h-4 w-[200px] rounded bg-muted" />
              <div className="h-4 w-[150px] rounded bg-muted" />
            </div>
          </div>
        ) : filteredAndSortedAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className={`relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg ${
              appointment.status === "COMPLETED" 
                ? "border-primary/20" 
                : appointment.status === "CANCELLED"
                ? "border-destructive/20"
                : "border-border"
            }`}
          >
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold tracking-tight">{appointment.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(appointment.status)} className="h-5">
                      {appointment.status === "COMPLETED" && <CheckCircleIcon className="mr-1 h-3 w-3" />}
                      {appointment.status === "SCHEDULED" && <Clock3Icon className="mr-1 h-3 w-3" />}
                      {appointment.status === "CANCELLED" && <XCircleIcon className="mr-1 h-3 w-3" />}
                      {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                    <Dialog open={isCompleteDialogOpen && appointmentToComplete?.id === appointment.id} onOpenChange={setIsCompleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAppointmentToComplete(appointment)
                            setIsCompleteDialogOpen(true)
                          }}
                          disabled={completingAppointments.has(appointment.id) || new Date(appointment.appointmentDate) > new Date()}
                        >
                          {completingAppointments.has(appointment.id) ? (
                            <>
                              <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" />
                              {new Date(appointment.appointmentDate) > new Date() ? "Cannot complete future appointment" : "Complete"}
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Appointment</DialogTitle>
                          <DialogDescription>
                            Add any remarks about the completed appointment.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="remarks" className="text-sm font-medium">
                              Admin Remarks
                            </label>
                            <textarea
                              id="remarks"
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter any remarks about the completed appointment..."
                              value={adminRemarks}
                              onChange={(e) => setAdminRemarks(e.target.value)}
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
                            onClick={() => appointmentToComplete && markAppointmentCompleted(appointmentToComplete)}
                          >
                            Complete Appointment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {appointment.status === "COMPLETED" && !appointment.adminRemarks && (
                    <Dialog open={isRemarksDialogOpen && appointmentToAddRemarks?.id === appointment.id} onOpenChange={setIsRemarksDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAppointmentToAddRemarks(appointment)
                            setIsRemarksDialogOpen(true)
                          }}
                        >
                          <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                          Add Remarks
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Admin Remarks</DialogTitle>
                          <DialogDescription>
                            Add your remarks for this completed appointment.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {appointment.userRemarks && (
                            <div className="space-y-2">
                              <label htmlFor="userRemarks" className="text-sm font-medium">
                                Client Remarks
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {appointment.userRemarks}
                              </p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label htmlFor="adminRemarks" className="text-sm font-medium">
                              Your Remarks
                            </label>
                            <textarea
                              id="adminRemarks"
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter your remarks about the completed appointment..."
                              value={adminRemarks}
                              onChange={(e) => setAdminRemarks(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" onClick={() => setIsRemarksDialogOpen(false)}>
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button 
                            variant="default" 
                            onClick={() => appointmentToAddRemarks && handleAddAdminRemarks(appointmentToAddRemarks)}
                            disabled={isAddingRemarks}
                          >
                            {isAddingRemarks ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Remarks"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
                            disabled={!cancellationReason.trim() || cancellingAppointments.has(appointmentToCancel?.id || "")}
                          >
                            {cancellingAppointments.has(appointmentToCancel?.id || "") ? (
                              <>
                                <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                      <p className="text-sm">
                        {format(new Date(appointment.appointmentDate), "PPP")} at{" "}
                        {format(new Date(appointment.appointmentDate), "p")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer</p>
                      <p className="text-sm">{appointment.customerName}</p>
                    </div>
                  </div>
                  {appointment.referenceNumber && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Payment Reference</p>
                        <p className="text-sm">Last 4 digits: {appointment.referenceNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock3Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="text-sm">
                        {Math.round((new Date(appointment.appointmentEndDate).getTime() - new Date(appointment.appointmentDate).getTime()) / (1000 * 60))} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarPlusIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p className="text-sm">
                        {format(new Date(appointment.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {appointment.description && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">{appointment.description}</p>
                </div>
              )}

              {appointment.status === "COMPLETED" && (
                <div className="space-y-4">
                  {appointment.userRemarks && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Client Remarks</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {appointment.userRemarks}
                      </p>
                    </div>
                  )}
                  {appointment.adminRemarks && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-center gap-2">
                        <ShieldIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Admin Remarks</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {appointment.adminRemarks}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {appointment.status === "COMPLETED" && appointment.rating && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <p className="text-sm font-medium">Customer Feedback</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`h-4 w-4 ${
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
                    {appointment.rating.sentimentCategory && (
                      <Badge variant="outline" className="h-5 font-normal">
                        <div className="flex items-center gap-1">
                          <div className={`h-2 w-2 rounded-full ${getSentimentColor(appointment.rating.sentimentCategory)}`} />
                          {getSentimentLabel(appointment.rating.sentimentCategory)}
                        </div>
                      </Badge>
                    )}
                  </div>
                  {appointment.rating.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {appointment.rating.comment}
                    </p>
                  )}
                </div>
              )}

              {appointment.status === "CANCELLED" && appointment.cancellationReason && (
                <div className="rounded-lg border bg-destructive/5 p-4">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium">Cancellation Reason</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {appointment.cancellationReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 