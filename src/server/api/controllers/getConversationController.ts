import { PrismaClient } from "@prisma/client"
import { publicProcedure } from "../trpc"
import { logger } from "../../utils/logger"
import { z } from "zod"

const prisma = new PrismaClient()

export const getConversationController = publicProcedure
  .input(z.object({ conversationId: z.string() }))
  .query(async ({ input }) => {
    try {
      const { conversationId } = input
      const conversation = await prisma.conversation.findUnique({
        where: {
          conversation_id: conversationId,
        },
        include: {
          messages: {
            orderBy: {
              created_at: "asc",
            },
          },
        },
      })

      if (!conversation) {
        throw new Error("Conversation not found.")
      }
      return { messages: conversation.messages, conversationEnded: conversation.has_ended }
    } catch (error: unknown) {
      // Specify unknown type instead of any
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error in getConversation: ${errorMessage}`)
      throw error instanceof Error ? error : new Error(String(error))
    }
  })