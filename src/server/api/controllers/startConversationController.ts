import { v4 as uuidv4 } from "uuid"
import { PrismaClient } from "@prisma/client"
import { publicProcedure } from "../trpc"
import { logger } from "../../utils/logger"
import { interviewQuestions } from "~/server/utils/requestConstants"
const prisma = new PrismaClient()

export const startConversationController = publicProcedure.query(async () => {
  try {
    const conversationId = uuidv4()
    const firstQuestion = interviewQuestions[0]

    await prisma.conversation.create({
      data: {
        conversation_id: conversationId,
        created_at: new Date(),
        has_ended: false,
        messages: {
          create: [
            {
              message_id: uuidv4(),
              message_type: "main",
              message_content: firstQuestion.question,
              role: "assistant", // Interviewer asks first question
              created_at: new Date(),
            },
          ],
        },
      },
    })

    return { conversationId, question: firstQuestion }
  } catch (error: unknown) {
    // Specify unknown type instead of any
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error in startConversation: ${errorMessage}`)
    throw error instanceof Error ? error : new Error(String(error))
  }
})