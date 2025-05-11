"use client"

import { useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import { ScrollArea } from "~/components/ui/scroll-area"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  type?: string
}

interface ChatContainerProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-4 py-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} content={message.content} role={message.role} type={message.type} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
