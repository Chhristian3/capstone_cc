import { useState, useEffect } from "react"
import { Notification } from "@prisma/client"
import { getNotifications } from "@/services/notifications"

export function useNotifications(pollInterval = 3000) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    async function fetchNotifications() {
      try {
        const data = await getNotifications({ isRead: false })
        setNotifications(data)
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      } finally {
        setIsLoading(false)
        // Schedule next poll
        timeoutId = setTimeout(fetchNotifications, pollInterval)
      }
    }

    // Initial fetch
    fetchNotifications()

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [pollInterval])

  return { notifications, isLoading }
} 