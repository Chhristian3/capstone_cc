// @ts-nocheck
"use client"

import * as React from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs"
import { Calendar as CalendarIcon, Plus } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { AppointmentDialog } from "@/components/appointment-dialog"
import { DatePicker } from "@/components/date-picker"
import { ModeToggle } from "@/components/mode-toggle"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const { allAppointments: appointments } = useAppointments()
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  const bookedDates = appointments.map((app) => new Date(app.appointmentDate))
  const sortedBookedDates = Array.from(
    new Set(bookedDates.map((date) => date.toISOString()))
  ).sort()

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="flex flex-row justify-between gap-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <span className="text-lg">{user?.fullName}</span>
        </div>
        <ModeToggle />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker onSelect={handleDateSelect} bookedDates={bookedDates} />
        <SidebarSeparator className="mx-0" />
        <div className="px-4 py-2">
          <h3 className="mb-3 text-lg font-semibold tracking-tight">All Booked Dates</h3>
          <ScrollArea className="h-[200px] rounded-md border">
            {sortedBookedDates.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                No appointments scheduled yet
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {Object.entries(
                  sortedBookedDates.reduce((acc, dateString) => {
                    const date = new Date(dateString)
                    const dateKey = date.toLocaleDateString()
                    if (!acc[dateKey]) {
                      acc[dateKey] = []
                    }
                    acc[dateKey].push(date)
                    return acc
                  }, {} as Record<string, Date[]>)
                ).map(([dateKey, dates], groupIndex) => (
                  <div key={dateKey} className="space-y-1.5">
                    {groupIndex > 0 && <Separator className="my-2" />}
                    <div className="text-sm font-medium text-muted-foreground">
                      {dateKey}
                    </div>
                    {dates.map((date, index) => {
                      const appointment = appointments.find(
                        (app) => new Date(app.appointmentDate).toISOString() === date.toISOString()
                      )
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm hover:bg-muted/80"
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="truncate">
                              {date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })} - {appointment ? new Date(appointment.appointmentEndDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : ""}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Plus />
              <span>New Appointment</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      {selectedDate && (
        <AppointmentDialog
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          appointments={appointments.filter(
            (app) =>
              new Date(app.appointmentDate).toDateString() ===
              selectedDate.toDateString()
          )}
        />
      )}
    </Sidebar>
  )
}
