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
    let returnObject: {
      conversationId: string,
      question: string,
      error: any
    } = {conversationId: "", question: "", error: undefined}

    try {
      const result = await startConversationQuery.refetch()
      if (result.data?.conversationId) {
        void allConversationsQuery.refetch()
        returnObject.conversationId = result.data.conversationId,
        returnObject.question = result.data.question,
        returnObject.error = result?.error?.message
      }
      return returnObject;
    } catch (err: any) {
      setError(err)
      console.error(err)
      logger.error(err);
      
      returnObject.error = err
      return returnObject
    }
  }, [startConversationQuery, allConversationsQuery])

  return {
    conversations: allConversationsQuery.data || [],
    isLoading: allConversationsQuery.isLoading || startConversationQuery.isLoading,
    error,
    startNewConversation,
    refetchConversations: allConversationsQuery.refetch,
  }
}