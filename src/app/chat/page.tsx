"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "~/hooks/useChat"
import { useConversations } from "~/hooks/useConversations"
import { ChatLayout } from "./components/ChatLayout"
import { WelcomeCard } from "./components/WelcomeCard"
import { ChatContainer } from "./components/ChatContainer"
import { ChatInput } from "./components/ChatInput"
import { Alert, AlertDescription } from "~/components/ui/alert"

export default function EnhancedChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use the conversations hook
  const { startNewConversation, refetchConversations, conversations } = useConversations()

  // Use the chat hook with the selected conversation ID
  const { messages, isLoading, isSubmitting, sendMessage, refetchMessages } = useChat(conversationId)

  // Handle starting a new conversation
  const handleStartConversation = async () => {
    const result = await startNewConversation()
    if (result?.conversationId) {
      setConversationId(result.conversationId)
    }
  }

  // Handle switching to a different conversation
  const handleSwitchConversation = (id: string) => {
    setConversationId(id)
    // Fix floating promise by using void
    void refetchMessages()
  }

  // Create an adapter function that matches the expected signature
  const handleSendMessageAdapter = (message: string) => {
    if (!message.trim() || !conversationId || isSubmitting) return

    void sendMessage(message)
    void refetchConversations()
  }

  const conversationEnded = conversations.some(
    (conversation) => conversation.id === conversationId && conversation.hasEnded === true,
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Refetch messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      void refetchMessages()
    }
  }, [conversationId, refetchMessages])

  return (
    <ChatLayout
      conversationId={conversationId}
      onSelectConversation={handleSwitchConversation}
      onStartNewConversation={handleStartConversation}
    >
      {!conversationId ? (
        <WelcomeCard onStartInterview={handleStartConversation} isLoading={isLoading} />
      ) : (
        <div className="flex flex-col h-full">
          <ChatContainer messages={messages} isLoading={isLoading} />

          <div className="mt-4">
            <ChatInput
              onSendMessage={handleSendMessageAdapter}
              isSubmitting={isSubmitting}
              disabled={conversationEnded}
            />
          </div>

          {conversationEnded && (
            <Alert className="mt-4">
              <AlertDescription>
                This interview has ended. Start a new interview or select another conversation.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </ChatLayout>
  )
}
