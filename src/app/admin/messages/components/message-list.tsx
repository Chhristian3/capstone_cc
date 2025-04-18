"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { useUser } from "@clerk/nextjs"

interface MessageInstance {
  id: string
  clientId: string
  updatedAt: string
  messages: {
    content: string
    createdAt: string
  }[]
}

export function MessageList() {
  const [messageInstances, setMessageInstances] = useState<MessageInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedInstanceId = searchParams.get("instanceId")
  const { user } = useUser()

  useEffect(() => {
    const fetchMessageInstances = async () => {
      try {
        const response = await fetch("/api/messages/instances")
        if (!response.ok) throw new Error("Failed to fetch message instances")
        const data = await response.json()
        setMessageInstances(data)
      } catch (error) {
        console.error("Error fetching message instances:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessageInstances()
    const interval = setInterval(fetchMessageInstances, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-2 p-4">
        {messageInstances.map((instance) => (
          <div
            key={instance.id}
            className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors ${
              selectedInstanceId === instance.id
                ? "bg-muted"
                : "hover:bg-muted/50"
            }`}
            onClick={() => router.push(`/admin/messages?instanceId=${instance.id}`)}
          >
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${instance.clientId}`} />
              <AvatarFallback>{instance.clientId.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Client {instance.clientId}</p>
              {instance.messages[0] && (
                <p className="text-sm text-muted-foreground truncate">
                  {instance.messages[0].content}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(instance.updatedAt), "MMM d, HH:mm")}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 