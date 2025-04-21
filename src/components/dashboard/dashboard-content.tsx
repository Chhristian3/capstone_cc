"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { CalendarIcon, BellIcon, MegaphoneIcon } from "lucide-react"
import { useAppointments } from "@/contexts/AppointmentContext"
import { useUser } from "@clerk/nextjs"
import { Notification, Announcement } from "@/types/global"

export function DashboardContent() {
  const { userAppointments } = useAppointments()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time on client-side only
    setCurrentTime(new Date())
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Fetch notifications
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data.slice(0, 5)))

    // Fetch announcements with a limit of 5
    fetch("/api/announcements?limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setAnnouncements(data)
        }
      })
      .catch((error) => {
        console.error("Error fetching announcements:", error)
      })

    return () => clearInterval(timer)
  }, [])

  const recentAppointments = userAppointments
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Good {currentTime ? (currentTime.getHours() < 12 ? "morning" : currentTime.getHours() < 18 ? "afternoon" : "evening") : ""}, {user?.firstName || "there"}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Current Time</span>
            <div className="text-2xl font-mono font-medium">
              {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Today&apos;s Date</span>
            <div className="text-lg">
              {currentTime ? format(currentTime, "EEEE, MMMM d, yyyy") : "Loading..."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{appointment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.appointmentDate), "PPP")}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.status}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-fit"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <BellIcon className="mt-1 h-4 w-4" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notification.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <MegaphoneIcon className="mt-1 h-4 w-4" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(announcement.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 