"use client"

import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function NotificationButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <BellIcon className="h-4 w-4" />
          <Badge variant="destructive" className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[10px]">
            <div className="flex h-full w-full items-center justify-center">
              1
            </div>
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuItem className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium">New appointment request</span>
            <span className="text-xs text-muted-foreground">John Doe requested an appointment</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium">Appointment reminder</span>
            <span className="text-xs text-muted-foreground">You have an appointment in 1 hour</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium">Appointment completed</span>
            <span className="text-xs text-muted-foreground">Your appointment has been marked as completed</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 