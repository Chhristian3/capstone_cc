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
  const { userAppointments: appointments } = useAppointments()
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
          <h3 className="mb-2 text-lg font-semibold">Booked Dates</h3>
          <ScrollArea className="h-[200px]">
            {sortedBookedDates.map((dateString, index) => {
              const date = new Date(dateString)
              return (
                <React.Fragment key={index}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="flex items-center py-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>
                      {date.toLocaleDateString()} - {date.toLocaleTimeString()}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
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
