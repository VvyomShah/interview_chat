"use server"

import OpenAI from "openai"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { publicProcedure } from "../trpc"
import { logger } from "../../utils/logger"
import { PrismaClient } from "@prisma/client"
import { systemPrompt } from "~/server/utils/requestConstants"
import { interviewQuestions } from "~/server/utils/requestConstants"
import type { ChatCompletion } from "openai/resources/index.mjs"
import type { AnalysisObject } from "~/types/common"

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

export const sendAnswerController = publicProcedure
  .input(
    z.object({
      conversationId: z.string(),
      answer: z.string().min(1, "Answer cannot be empty."),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI Key is missing")
      }
      const { conversationId, answer } = input

      // Log input
      logger.info(`sendAnswer input: conversationId=${conversationId}, answer=${answer}`)
      console.log(`sendAnswer input: conversationId=${conversationId}, answer=${answer}`)

      // Add user's answer to the database
      const userMessageId = uuidv4()
      const assistantMessageId = uuidv4()
      await prisma.message.create({
        data: {
          message_id: userMessageId,
          conversation_id: conversationId,
          message_type: "answer",
          message_content: answer,
          role: "user",
          created_at: new Date(),
        },
      })

      // Fetch the conversation, including messages
      const conversation = await prisma.conversation.findUniqueOrThrow({
        where: { conversation_id: conversationId },
        include: { messages: { orderBy: { created_at: "asc" } } },
      })

      if (conversation.has_ended) {
        return {
          shouldEnd: true,
          response: "Apologies, this interview has ended",
          nextQuestion: "Apologies, this interview has ended",
        }
      }

      const lastMainQuestionIndex: number =
        conversation.messages.reduce((acc, curr) => {
          if (curr.message_type == "main") {
            return acc + 1
          } else {
            return acc
          }
        }, 0) - 1
      const dbMessages = conversation.messages

      // Convert database messages to the format expected by OpenAI
      let historyForOpenAI = dbMessages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.message_content,
      }))

      // Add last main question's context
      historyForOpenAI = [{ role: "system", content: systemPrompt }, ...historyForOpenAI]
      const lastQuestion = historyForOpenAI[historyForOpenAI.length - 2]
      if (lastQuestion?.content) {
        lastQuestion.content = lastQuestion?.content + (interviewQuestions[lastMainQuestionIndex]?.context ?? "")
      }

      // Get response from OpenAI
      const openaiResponse: ChatCompletion = await openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages: historyForOpenAI,
        response_format: { type: "json_object" },
      })

      const aiResponse: string =
        openaiResponse.choices[0]?.message?.content ?? `{"followUp": false, "response": "", "shouldEnd": false}`

      // Log the AI response
      logger.info(`OpenAI Response: ${aiResponse}`)
      console.log(`OpenAI Response:`, aiResponse)

      let analysis: AnalysisObject

      try {
        analysis = JSON.parse(aiResponse) as AnalysisObject
      } catch (e: unknown) {
        const parseError = `JSON Parse Error: ${e instanceof Error ? e.message : String(e)}, Response: ${aiResponse}`
        logger.error(parseError)
        console.error(parseError)
        throw new Error("Failed to parse AI response: " + parseError)
      }

      const returnObject = {
        shouldEnd: false,
        response: "",
        nextQuestion: "",
      }

      // Add interviewer's response to the database
      if (!analysis.shouldEnd) {
        const nextQuestionIndex = lastMainQuestionIndex + 1

        if (analysis.followUp) {
          returnObject.nextQuestion = analysis.response
        } else if (nextQuestionIndex >= interviewQuestions.length) {
          returnObject.nextQuestion = "Thank you for your time!"
          returnObject.shouldEnd = true
        } else {
          returnObject.nextQuestion = analysis.response + " " + interviewQuestions[nextQuestionIndex]?.question
        }

        await prisma.message.create({
          data: {
            message_id: assistantMessageId,
            conversation_id: conversationId,
            message_type: analysis.followUp ? "followup" : "main",
            message_content: returnObject.nextQuestion,
            role: "assistant",
            created_at: new Date(),
          },
        })

        return returnObject
      }

      // Update conversation's has_ended status
      if (analysis.shouldEnd || (!analysis.followUp && lastMainQuestionIndex == historyForOpenAI.length - 1)) {
        await prisma.message.create({
          data: {
            message_id: assistantMessageId,
            conversation_id: conversationId,
            message_type: "answer",
            message_content: analysis.response !== "" ? analysis.response : "Thank you for your time!",
            role: "assistant",
            created_at: new Date(),
          },
        })

        await prisma.conversation.update({
          where: { conversation_id: conversationId },
          data: { has_ended: true },
        })

        returnObject.shouldEnd = true
        returnObject.response = analysis.response !== "" ? analysis.response : "Thank you for your time!"
        returnObject.nextQuestion = analysis.response !== "" ? analysis.response : "Thank you for your time!"
        return returnObject
      }
    } catch (error: unknown) {
      // Specify unknown type instead of any
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error in sendAnswer: ${errorMessage}`)
      console.error(`Error in sendAnswer: ${errorMessage}`)
      throw error instanceof Error ? error : new Error(String(error))
    }
  })
