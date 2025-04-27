"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import { MessageChat } from "./message-chat"
import { cn } from "@/lib/utils"

export function ChatBubble() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-4 md:right-4">
      {isExpanded ? (
        <div className="fixed inset-0 z-50 md:relative md:w-[350px] md:h-[500px] bg-background rounded-lg shadow-lg border flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">Chat Support</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <MessageChat />
          </div>
        </div>
      ) : (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsExpanded(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
} 