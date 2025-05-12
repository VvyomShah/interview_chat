"use client"

import { useState, useCallback, useEffect } from "react"
import { api } from "~/trpc/react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  type?: string
}

export const useChat = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get conversation query
  const getConversationQuery = api.chat.getConversation.useQuery(
    { conversationId: conversationId ?? "" }, // Use nullish coalescing
    {
      enabled: !!conversationId,
    },
  )

  // Send answer mutation
  const sendAnswerMutation = api.chat.sendAnswer.useMutation()

  // Update messages when conversation data changes
  useEffect(() => {
    if (getConversationQuery.data?.messages) {
      try {
        const formattedMessages = getConversationQuery.data.messages.map((msg) => ({
          id: msg.message_id,
          content: msg.message_content,
          role: msg.role as "user" | "assistant",
          type: msg.message_type,
        }))
        setMessages(formattedMessages)
      } catch (error: unknown) {
        // Specify unknown type instead of any
        if (error instanceof Error) {
          setError(error)
        } else {
          setError(new Error(String(error)))
        }
      }
    }
  }, [getConversationQuery.data])

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim() || isSubmitting) return

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: "user",
      }

      setMessages((prev) => [...prev, userMessage])
      setIsSubmitting(true)

      try {
        const result = await sendAnswerMutation.mutateAsync({
          conversationId,
          answer: content,
        })

        if (result?.nextQuestion) {
          const aiResponse: Message = {
            id: crypto.randomUUID(),
            content: result.nextQuestion,
            role: "assistant",
          }
          setMessages((prev) => [...prev, aiResponse])
        }
      } catch (error: unknown) {
        // Specify unknown type instead of any
        if (error instanceof Error) {
          setError(error)
        } else {
          setError(new Error(String(error)))
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [conversationId, isSubmitting, sendAnswerMutation],
  )

  return {
    messages,
    isLoading: getConversationQuery.isLoading,
    isSubmitting,
    error,
    sendMessage,
    refetchMessages: getConversationQuery.refetch,
  }
}