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
  messages: {
    id: string
    content: string
    senderId: string
    createdAt: string
  }[]
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  } | null
}

export function MessageList() {
  const [instances, setInstances] = useState<MessageInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<MessageInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedClientId = searchParams.get("clientId")
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
        
        // Set the first instance's client ID if no client ID is currently selected
        if (!selectedClientId && data.length > 0) {
          router.push(`/admin/messages?clientId=${data[0].clientId}`)
        }
      } catch (error) {
        console.error("Error fetching message instances:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstances()
    const interval = setInterval(fetchInstances, 2000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [router, selectedClientId])

  useEffect(() => {
    const fetchSelectedInstance = async () => {
      if (!selectedClientId) {
        setSelectedInstance(null)
        return
      }

      try {
        const response = await fetch(`/api/messages/instances?clientId=${selectedClientId}`)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch selected instance")
        }
        const data = await response.json()
        setSelectedInstance(data[0] || null)
      } catch (error) {
        console.error("Error fetching selected instance:", error)
      }
    }

    fetchSelectedInstance()
  }, [selectedClientId])

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
        {instances.map((instance) => {
          const lastMessage = instance.messages[0]
          const client = instance.client

          return (
            <button
              key={instance.id}
              onClick={() => router.push(`/admin/messages?clientId=${instance.clientId}`)}
              className={`w-full p-3 rounded-lg transition-colors ${
                selectedClientId === instance.clientId
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={client?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${instance.clientId}`} />
                  <AvatarFallback>
                    {client?.firstName?.[0]}{client?.lastName?.[0] || instance.clientId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {client?.firstName && client?.lastName
                        ? `${client.firstName} ${client.lastName}`
                        : `Client ${instance.clientId}`}
                    </p>
                    <p className="text-xs opacity-70">
                      {format(new Date(instance.updatedAt), "HH:mm")}
                    </p>
                  </div>
                  {lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
} 