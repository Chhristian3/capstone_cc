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

type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc"
type FilterOption = "all" | "active" | "completed" | "expired"

export function AdminAppointmentList() {
  const { allAppointments, refreshAppointments } = useAppointments()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")
  const [filterOption, setFilterOption] = useState<FilterOption>("all")

  const markAppointmentCompleted = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
        method: "PUT",
      })
      if (!response.ok) {
        throw new Error("Failed to mark appointment as completed")
      }
      refreshAppointments()
    } catch (error) {
      console.error("Error marking appointment as completed:", error)
    }
  }

  const filteredAndSortedAppointments = allAppointments
    .filter((appointment) => {
      // Filter by search query
      const matchesSearch =
        appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.customerName.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by status
      const now = new Date()
      const appointmentDate = new Date(appointment.appointmentDate)
      const expirationDate = new Date(appointment.expirationDate)
      const isCompleted = expirationDate < now
      const isExpired = appointmentDate < now && !isCompleted
      const isActive = appointmentDate >= now

      switch (filterOption) {
        case "active":
          return matchesSearch && isActive
        case "completed":
          return matchesSearch && isCompleted
        case "expired":
          return matchesSearch && isExpired
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

  const getAppointmentStatus = (appointment: any) => {
    const now = new Date()
    const appointmentDate = new Date(appointment.appointmentDate)
    const expirationDate = new Date(appointment.expirationDate)

    if (expirationDate < now) {
      return <Badge variant="default">Completed</Badge>
    } else if (appointmentDate < now) {
      return <Badge variant="destructive">Expired</Badge>
    } else {
      return <Badge variant="secondary">Active</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedAppointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{appointment.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />
                    {appointment.customerName}
                  </div>
                </CardDescription>
              </div>
              {getAppointmentStatus(appointment)}
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {format(new Date(appointment.appointmentDate), "PPP")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    {format(new Date(appointment.appointmentDate), "p")} -{" "}
                    {format(new Date(appointment.appointmentEndDate), "p")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{appointment.serviceType.name}</Badge>
                </div>
                {appointment.description && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-sm text-muted-foreground">
                      {appointment.description}
                    </p>
                  </>
                )}
                <Separator className="my-2" />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAppointmentCompleted(appointment.id)}
                    disabled={new Date(appointment.expirationDate) < new Date()}
                  >
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 