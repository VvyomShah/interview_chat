"use client"

import { useState, useCallback } from "react"
import { api } from "~/trpc/react"
import { logger } from "~/server/utils/logger"

export const useConversations = () => {
  const [error, setError] = useState<Error | null>(null)

  // Get all conversations
  const allConversationsQuery = api.chat.getAllConversations.useQuery()

  // Start conversation query
  const startConversationQuery = api.chat.startConversation.useQuery(undefined, {
    enabled: false,
  })

  // Start a new conversation
  const startNewConversation = useCallback(async () => {
    const returnObject: {
      conversationId: string
      question: string
      error: string | undefined
    } = { conversationId: "", question: "", error: undefined }

    try {
      const result = await startConversationQuery.refetch()
      if (result.data?.conversationId) {
        void allConversationsQuery.refetch()
        returnObject.conversationId = result.data.conversationId
        returnObject.question = result.data.question.question
        returnObject.error = result?.error?.message
      }
      return returnObject
    } catch (error: unknown) {
      // Specify unknown type instead of any
      if (error instanceof Error) {
        setError(error)
        console.error(error)
        logger.error(error)

        returnObject.error = error.message
      } else {
        const errorMessage = String(error)
        setError(new Error(errorMessage))
        console.error(errorMessage)
        logger.error(errorMessage)

        returnObject.error = errorMessage
      }
      return returnObject
    }
  }, [startConversationQuery, allConversationsQuery])

  return {
    conversations: allConversationsQuery.data ?? [], // Use nullish coalescing
    isLoading: allConversationsQuery.isLoading || startConversationQuery.isLoading,
    error,
    startNewConversation,
    refetchConversations: allConversationsQuery.refetch,
  }
}