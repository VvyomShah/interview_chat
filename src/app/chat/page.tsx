"use client"
import { useState, useEffect, useRef } from "react"
import { useChat } from "~/hooks/useChat"
import { useConversations } from "~/hooks/useConversations"
import { ChatLayout } from "./components/ChatLayout"
import { WelcomeCard } from "./components/WelcomeCard"
import { ChatContainer } from "./components/ChatContainer"
import { ChatInput } from "./components/ChatInput"
import { Alert, AlertDescription } from "~/components/ui/alert"

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use the conversations hook
  const { startNewConversation, refetchConversations, conversations} = useConversations()

  // Use the chat hook with the selected conversation ID
  const { messages, isLoading, isSubmitting, error, sendMessage, refetchMessages } = useChat(conversationId)

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
    refetchMessages()
  }

  // Handle sending a message
  const handleSendMessage = async(content: string) => {
    if (!content.trim() || !conversationId || isSubmitting) return

    const response = await sendMessage(content)
    if (response?.shouldEnd){
      refetchConversations()
    }
  }

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

  // Check if the conversation has ended
  const conversationEnded = conversations.some(
    (conversation) => conversation.id === conversationId &&
                      conversation.hasEnded === true)

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
            <ChatInput onSendMessage={handleSendMessage} isSubmitting={isSubmitting} disabled={conversationEnded} />
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
