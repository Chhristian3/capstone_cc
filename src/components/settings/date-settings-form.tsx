"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DateStatus } from "@prisma/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DateSettingsFormProps {
  onSuccess: () => void
}

export function DateSettingsForm({ onSuccess }: DateSettingsFormProps) {
  const [status, setStatus] = useState<DateStatus>(DateStatus.WHOLE_DAY)
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("17:00")
  const [reason, setReason] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const today = new Date()
      const selectedDate = today.toISOString().split('T')[0]
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
      onSuccess()
      resetForm()
    } catch (error) {
      toast.error("Failed to save date settings")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStatus(DateStatus.WHOLE_DAY)
    setStartTime("09:00")
    setEndTime("17:00")
    setReason("")
  }

  return (
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
  )
} 