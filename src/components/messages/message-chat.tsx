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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const searchParams = useSearchParams()
  const clientId = searchParams.get("clientId") || user?.id
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
        
        if (!instance) {
          setInstance(null)
          setMessages([])
          setIsLoading(false)
          return
        }

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
    const interval = setInterval(fetchMessages, 3000) 

    return () => clearInterval(interval)
  }, [clientId, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !clientId || isSubmitting) return

    setIsSubmitting(true)
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !clientId || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Create a new message instance
      const instanceResponse = await fetch("/api/messages/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
        }),
      })

      if (!instanceResponse.ok) {
        throw new Error("Failed to create message instance")
      }

      const newInstance = await instanceResponse.json()

      // Send the first message
      const messageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageInstanceId: newInstance.id,
          content: newMessage,
        }),
      })

      if (!messageResponse.ok) throw new Error("Failed to send message")
      
      setNewMessage("")
      const newMessageData = await messageResponse.json()
      setInstance(newInstance)
      setMessages([newMessageData])
    } catch (error) {
      console.error("Error starting conversation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!instance) {
    const isClient = clientId === user?.id

    if (isClient) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Have any concerns or questions? Our support team is here to help you.
              </p>
            </div>
            <form onSubmit={handleStartConversation} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Our support team will get back to you as soon as possible.
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !newMessage.trim()}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No messages yet. Wait for the client to start the conversation.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = message.senderId === user?.id
            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && (
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
                    isCurrentUser
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  {!isCurrentUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium">
                        {message.sender?.firstName && message.sender?.lastName
                          ? `${message.sender.firstName} ${message.sender.lastName}`
                          : "User"}
                      </p>
                      {message.senderId !== instance?.clientId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.createdAt), "HH:mm")}
                  </p>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.id}`} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0] || user?.id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="shrink-0"
            disabled={isSubmitting}
          >
            <Send className={cn("h-4 w-4", isSubmitting && "animate-pulse")} />
          </Button>
        </form>
      </div>
    </div>
  )
} 