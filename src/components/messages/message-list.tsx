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
  createdAt: string
  updatedAt: string
}

export function MessageList() {
  const [instances, setInstances] = useState<MessageInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<MessageInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedInstanceId = searchParams.get("instanceId")
  const { user } = useUser()

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await fetch("/api/messages/instances")
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch message instances")
        }
        const data = await response.json()
        setInstances(data)
      } catch (error) {
        console.error("Error fetching message instances:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstances()
    const interval = setInterval(fetchInstances, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchSelectedInstance = async () => {
      if (!selectedInstanceId) {
        setSelectedInstance(null)
        return
      }

      try {
        const response = await fetch(`/api/messages/instances/${selectedInstanceId}`)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch selected instance")
        }
        const data = await response.json()
        setSelectedInstance(data)
      } catch (error) {
        console.error("Error fetching selected instance:", error)
      }
    }

    fetchSelectedInstance()
  }, [selectedInstanceId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {instances.map((instance) => (
          <button
            key={instance.id}
            onClick={() => router.push(`/admin/messages?instanceId=${instance.id}`)}
            className={`w-full p-3 rounded-lg transition-colors ${
              selectedInstanceId === instance.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${instance.clientId}`} />
                <AvatarFallback>{instance.clientId.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">Client {instance.clientId}</p>
                  <p className="text-xs opacity-70">
                    {format(new Date(instance.updatedAt), "HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
} 