"use client"

import { BellIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { markAsRead, markAllAsRead } from "@/services/notifications"
import { Notification } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationButton() {
  const { notifications, isLoading } = useNotifications()

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-10 w-10 min-w-0 min-h-0 p-0 sm:h-10 sm:w-10">
          <BellIcon className="h-4 w-4" />
          {notifications.length > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[10px]">
              <div className="flex h-full w-full items-center justify-center">
                {notifications.length}
              </div>
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <div className="p-2 overflow-y-auto max-h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-center gap-2"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {notification.content}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNotificationClick(notification)
                  }}
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center justify-center gap-2 text-sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckIcon className="h-4 w-4" />
              Mark all as read
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 