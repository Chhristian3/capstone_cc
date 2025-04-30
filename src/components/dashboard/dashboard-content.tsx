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
import { AddAppointmentButton } from "@/components/buttons/add-appointment-button"

export function DashboardContent() {
  const { userAppointments } = useAppointments()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Add debugging
  useEffect(() => {
    console.log('User Appointments:', userAppointments)
  }, [userAppointments])

  const recentAppointments = userAppointments
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
    .slice(0, 5)

  // Add debugging
  useEffect(() => {
    console.log('Recent Appointments:', recentAppointments)
  }, [recentAppointments])

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-3 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Good {currentTime ? (currentTime.getHours() < 12 ? "morning" : currentTime.getHours() < 18 ? "afternoon" : "evening") : ""}, {user?.firstName || "there"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Current Time</span>
            <div className="text-xl sm:text-2xl font-mono font-medium">
              {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-border" />
          <div className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Today&apos;s Date</span>
            <div className="text-base sm:text-lg">
              {currentTime ? format(currentTime, "EEEE, MMMM d, yyyy") : "Loading..."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
            {recentAppointments.length > 0 ? (
              <ScrollArea className="h-[250px] sm:h-[300px]">
                <div className="space-y-3 sm:space-y-4 px-2">
                  {recentAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
                    >
                      <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-xs sm:text-sm font-medium">{appointment.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(appointment.appointmentDate), "PPP")}
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {appointment.status}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] sm:h-[300px] space-y-4 text-center">
                <div className="rounded-full bg-muted p-3">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No appointments yet</p>
                  <p className="text-xs text-muted-foreground">
                    Schedule your first appointment to get started
                  </p>
                </div>
                <AddAppointmentButton />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-2 sm:p-6 pt-0 sm:pt-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full max-w-[280px]"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="space-y-3 sm:space-y-4 px-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3"
                  >
                    <BellIcon className="mt-1 h-3 w-3 sm:h-4 sm:w-4" />
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-sm font-medium">{notification.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {notification.content}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(new Date(notification.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Announcements</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="space-y-3 sm:space-y-4 px-2">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3"
                  >
                    <MegaphoneIcon className="mt-1 h-3 w-3 sm:h-4 sm:w-4" />
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-sm font-medium">{announcement.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {announcement.content}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
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