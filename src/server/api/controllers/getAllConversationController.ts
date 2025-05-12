import { PrismaClient } from "@prisma/client"
import { publicProcedure } from "../trpc"
import { logger } from "../../utils/logger"

const prisma = new PrismaClient()

export const getAllConversationsController = publicProcedure.query(async () => {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        conversation_id: true,
        created_at: true,
        has_ended: true,
      },
    })

    // Format the conversations for the frontend
    return conversations.map((conversation) => ({
      id: conversation.conversation_id,
      createdAt: conversation.created_at,
      hasEnded: conversation.has_ended,
      title: conversation.conversation_id,
    }))
  } catch (error: unknown) {
    // Specify unknown type instead of any
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error in getAllConversations: ${errorMessage}`)
    throw error instanceof Error ? error : new Error(String(error))
  }
})
