"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { DateStatus } from "@prisma/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SelectedDate {
  id: string
  date: string
  status: DateStatus
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export default function SettingsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<DateStatus>(DateStatus.WHOLE_DAY)
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("17:00")
  const [reason, setReason] = useState<string>("")
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Create a set of disabled dates from existing settings
  const disabledDates = useMemo(() => {
    return selectedDates.map(date => new Date(date.date))
  }, [selectedDates])

  // Get the date range for valid selection
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(today.getDate() + 30)
    thirtyDaysLater.setHours(23, 59, 59, 999)

    return {
      minDate: today,
      maxDate: thirtyDaysLater
    }
  }, [])

  // Create modifiers for the calendar
  const modifiers = useMemo(() => ({
    booked: disabledDates,
    disabled: (date: Date) => {
      return date < minDate || date > maxDate
    }
  }), [disabledDates, minDate, maxDate])

  // Calculate end time based on start time and status
  const calculateEndTime = (startTime: string, status: DateStatus): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    const hoursToAdd = status === DateStatus.WHOLE_DAY ? 8 : 4
    const endDate = new Date(startDate.getTime() + hoursToAdd * 60 * 60 * 1000)

    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }

  // Update end time whenever start time or status changes
  useEffect(() => {
    setEndTime(calculateEndTime(startTime, status))
  }, [startTime, status])

  // Fetch selected dates on component mount
  useEffect(() => {
    fetchSelectedDates()
  }, [])

  const fetchSelectedDates = async () => {
    try {
      const response = await fetch("/api/settings/date")
      const data = await response.json()
      setSelectedDates(data)
    } catch (error) {
      toast.error("Failed to fetch selected dates")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Ensure we're using the correct date format without timezone offset
      const selectedDate = date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0] : undefined
      const startDateTime = `${selectedDate}T${startTime}:00`
      const endDateTime = `${selectedDate}T${endTime}:00`

      const response = await fetch("/api/settings/date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          status,
          startTime: status !== DateStatus.DISABLED ? startDateTime : null,
          endTime: status !== DateStatus.DISABLED ? endDateTime : null,
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save date settings")
      }

      toast.success("Date settings saved successfully")
      fetchSelectedDates()
      resetForm()
    } catch (error) {
      toast.error("Failed to save date settings")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDate(new Date())
    setStatus(DateStatus.WHOLE_DAY)
    setStartTime("09:00")
    setEndTime("17:00")
    setReason("")
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/settings/date?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete date")
      }

      toast.success("Date deleted successfully")
      fetchSelectedDates()
    } catch (error) {
      toast.error("Failed to delete date")
    }
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Date Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar and Form Section */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={disabledDates}
                modifiers={modifiers}
                modifiersStyles={{
                  booked: {
                    backgroundColor: 'rgb(239 68 68 / 0.2)',
                    color: 'rgb(239 68 68)',
                    fontWeight: 'bold',
                    pointerEvents: 'none', 
                    userSelect: 'none',
                    opacity: 0.8,  
                    textDecoration: 'line-through',   
                  },
                  disabled: {
                    backgroundColor: 'rgb(156 163 175 / 0.2)',
                    color: 'rgb(156 163 175)',
                    textDecoration: 'line-through',
                  }
                }}
                className="rounded-md border w-fit [&_.booked]:bg-red-100 [&_.booked]:text-red-700 [&_.disabled]:bg-gray-100 [&_.disabled]:text-gray-400 [&_.disabled]:line-through"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Date Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date Status</Label>
                  <RadioGroup
                    value={status}
                    onValueChange={(value) => setStatus(value as DateStatus)}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={DateStatus.WHOLE_DAY} id="whole-day" />
                      <Label htmlFor="whole-day" className="text-sm">Whole Day</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={DateStatus.HALF_DAY} id="half-day" />
                      <Label htmlFor="half-day" className="text-sm">Half Day</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={DateStatus.DISABLED} id="disabled" />
                      <Label htmlFor="disabled" className="text-sm">Disabled</Label>
                    </div>
                  </RadioGroup>
                </div>

                {status !== DateStatus.DISABLED && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-sm">Start Time</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">End Time (Auto-calculated)</Label>
                      <Input
                        type="time"
                        value={endTime}
                        disabled
                        className="h-9 bg-muted"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-sm">Reason (Optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this date setting"
                    className="h-20"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Data Table Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Selected Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[200px]">Time Range</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDates.map((date) => (
                      <TableRow key={date.id}>
                        <TableCell className="font-medium">
                          {format(new Date(date.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            date.status === DateStatus.WHOLE_DAY
                              ? "bg-green-100 text-green-700"
                              : date.status === DateStatus.HALF_DAY
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {date.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {date.startTime && date.endTime
                            ? `${format(new Date(date.startTime), "h:mm a")} - ${format(
                                new Date(date.endTime),
                                "h:mm a"
                              )}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {date.reason || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(date.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 