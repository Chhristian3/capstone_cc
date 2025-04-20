"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { format } from "date-fns"
import { useUser } from "@clerk/nextjs"
import { Send, MoreVertical, Phone, Video } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  isRead: boolean
  sender: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  } | null
}

interface MessageInstance {
  id: string
  clientId: string
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  } | null
  messages: Message[]
}

export function MessageChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [instance, setInstance] = useState<MessageInstance | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const clientId = searchParams.get("clientId")
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!clientId) return

    const fetchMessages = async () => {
      try {
        // First get the instance for this client
        const instanceResponse = await fetch(`/api/messages/instances?clientId=${clientId}`)
        if (!instanceResponse.ok) {
          throw new Error("Failed to fetch message instance")
        }
        const instances = await instanceResponse.json()
        const instance = instances[0]
        
        if (!instance) return

        const response = await fetch(`/api/messages/instances/${instance.id}`)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch messages")
        }
        const data = await response.json()
        setInstance(data)
        setMessages(data.messages.reverse()) // Reverse to show oldest first
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [clientId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !clientId) return

    try {
      // First get the instance for this client
      const instanceResponse = await fetch(`/api/messages/instances?clientId=${clientId}`)
      if (!instanceResponse.ok) {
        throw new Error("Failed to fetch message instance")
      }
      const instances = await instanceResponse.json()
      const instance = instances[0]
      
      if (!instance) return

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageInstanceId: instance.id,
          content: newMessage,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")
      
      setNewMessage("")
      const newMessageData = await response.json()
      setMessages((prev) => [...prev, newMessageData])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a conversation to start messaging</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={instance?.client?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${instance?.clientId}`} />
            <AvatarFallback>
              {instance?.client?.firstName?.[0]}{instance?.client?.lastName?.[0] || instance?.clientId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {instance?.client?.firstName && instance?.client?.lastName
                ? `${instance.client.firstName} ${instance.client.lastName}`
                : `Client ${instance?.clientId}`}
            </p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start space-x-4",
                message.senderId === user?.id ? "justify-end" : "justify-start"
              )}
            >
              {message.senderId !== user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${message.senderId}`} />
                  <AvatarFallback>
                    {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0] || message.senderId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3",
                  message.senderId === user?.id
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted rounded-tl-none"
                )}
              >
                {message.senderId !== user?.id && (
                  <p className="text-xs font-medium mb-1">
                    {message.sender?.firstName && message.sender?.lastName
                      ? `${message.sender.firstName} ${message.sender.lastName}`
                      : `User ${message.senderId}`}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {format(new Date(message.createdAt), "HH:mm")}
                </p>
              </div>
              {message.senderId === user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
} 