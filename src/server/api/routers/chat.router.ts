import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../trpc';
import OpenAI from 'openai';
import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the interview questions globally
const interviewQuestions = [
    "Tell me about yourself.",
    "Why are you interested in this position?",
    "What are your strengths?",
    "What are your weaknesses?",
    "Where do you see yourself in five years?",
    "Why do you want to leave your current job?",
    "What is your expected salary?",
    "Do you have any questions for me?",
];

// System prompt
const systemPrompt = `You are a friendly job interviewer. Conduct a job interview.
Use the previous turns of the conversation to maintain context.
Determine if the candidate has fully answered the question.
If the candidate has not answered the question, respond with the same question.
If the candidate's answer requires a follow-up question to get more context, ask a relevant follow-up question. This follow-up should only ask to elaborate on missing context.
If the candidate's answer is sufficient, set "followUp" to false and "followUpQuestion" to "".
If the candidate says they are not interested in the job, set "shouldEnd" to true.
If the candidate's salary is higher than $200,000, set "shouldEnd" to true.
Respond with a JSON object. The JSON object MUST be valid JSON.
The JSON object MUST contain:
- "followUp" (boolean)
- "followUpQuestion" (string)
- "shouldEnd" (boolean)
Example response 1: {"followUp": false, "followUpQuestion": ""}
Example response 2: {"followUp": true, "followUpQuestion": "Can you elaborate on your role?"}
Example response 3: {"followUp": false, "followUpQuestion": "", "shouldEnd": true}`;

export const chatRouter = createTRPCRouter({
    startConversation: publicProcedure
        .query(async () => {
            const conversationId = uuidv4();
            const firstQuestion = interviewQuestions[0];

            await prisma.conversation.create({
                data: {
                    conversation_id: conversationId,
                    created_at: new Date(),
                    has_ended: false, // Initialize has_ended in Conversation
                    messages: {
                        create: [
                            {
                                message_id: uuidv4(),
                                message_type: 'main',
                                message_content: firstQuestion,
                                role: 'assistant', // Interviewer asks first question
                                created_at: new Date(),
                            },
                        ],
                    },
                },
            });

            return { conversationId, question: firstQuestion };
        }),

    getConversation: publicProcedure
        .input(z.object({ conversationId: z.string() }))
        .query(async ({ input }) => {
            const { conversationId } = input;

            const conversation = await prisma.conversation.findUnique({
                where: {
                    conversation_id: conversationId,
                },
                include: {
                    messages: {
                        orderBy: {
                            created_at: 'asc',
                        },
                    },
                },
            });

            if (!conversation) {
                throw new Error("Conversation not found."); // Handle non-existent conversation
            }

            // Return whether the conversation has ended
            return { messages: conversation.messages, conversationEnded: conversation.has_ended };
        }),

    sendAnswer: publicProcedure
        .input(z.object({ conversationId: z.string(), answer: z.string().min(1, "Answer cannot be empty.") }))
        .mutation(async ({ input }) => {
            try {
                if (!process.env.OPENAI_API_KEY) {
                    throw new Error('OpenAI Key is missing');
                }
                const { conversationId, answer } = input;

                // Log input
                logger.info(`sendAnswer input: conversationId=${conversationId}, answer=${answer}`);
                console.log(`sendAnswer input: conversationId=${conversationId}, answer=${answer}`);

                // Add user's answer to the database
                const userMessageId = uuidv4();
                await prisma.message.create({
                    data: {
                        message_id: userMessageId,
                        conversation_id: conversationId,
                        message_type: 'answer',
                        message_content: answer,
                        role: 'user',
                        created_at: new Date(),
                    },
                });

                // Fetch the conversation, including messages
                const conversation = await prisma.conversation.findUnique({
                    where: { conversation_id: conversationId },
                    include: { messages: { orderBy: { created_at: 'asc' } } },
                });

                if (!conversation) {
                    throw new Error("Conversation not found.");
                }
                const dbMessages = conversation.messages;


                // Convert database messages to the format expected by OpenAI
                let historyForOpenAI = dbMessages.map((msg) => ({
                    role: msg.role as 'system' | 'user' | 'assistant',
                    content: msg.message_content,
                }));

                // Add system pormpt
                historyForOpenAI = [{role: "system", content: systemPrompt}, ...historyForOpenAI]

                // Get response from OpenAI
                const openaiResponse = await openai.chat.completions.create({
                    model: 'gpt-4.1-nano',
                    messages: historyForOpenAI,
                });

                const aiResponse = openaiResponse.choices[0]?.message?.content || "{\"followUp\": false, \"followUpQuestion\": \"\", \"shouldEnd\": false}";

                // Log the AI response
                logger.info(`OpenAI Response: ${aiResponse}`);
                console.log(`OpenAI Response:`, aiResponse);

                let analysis: { followUp: boolean; followUpQuestion: string; shouldEnd: boolean; } = { followUp: false, followUpQuestion: "", shouldEnd: false };
                try {
                    analysis = JSON.parse(aiResponse);
                } catch (e: any) {
                    const parseError = `JSON Parse Error: ${e.message}, Response: ${aiResponse}`;
                    logger.error(parseError);
                    console.error(parseError);
                    throw new Error("Failed to parse AI response: " + parseError);
                }

                // Add interviewer's response to the database
                if (analysis.followUpQuestion || !analysis.shouldEnd) {
                    const assistantMessageId = uuidv4();
                    let nextQuestion = "";
                    if (!analysis.followUp)
                    {
                         const nextQuestionIndex = dbMessages.filter(m => m.role === 'assistant' && m.message_type === 'main').length; // number of main questions
                         nextQuestion = interviewQuestions[nextQuestionIndex] ?? "Thank you for your time."; // get next question
                    }
                    await prisma.message.create({
                        data: {
                            message_id: assistantMessageId,
                            conversation_id: conversationId,
                            message_type: analysis.followUp ? 'followup' : 'main',
                            message_content: analysis.followUp ? analysis.followUpQuestion : nextQuestion, // use nextQuestion
                            role: 'assistant',
                            created_at: new Date(),
                        },
                    });
                }


                // Update conversation's has_ended status
                if (analysis.shouldEnd) {
                    await prisma.conversation.update({
                        where: { conversation_id: conversationId },
                        data: { has_ended: true },
                    });
                    return { shouldEnd: true, response: "Thank you for your time." };
                }

                return {
                    shouldEnd: false,
                    response: analysis.followUp ? analysis.followUpQuestion : "Okay, next question.", //Added a default message.
                    nextQuestion: analysis.followUp ? analysis.followUpQuestion : undefined
                };
            } catch (error: any) {
                logger.error(`Error in sendAnswer: ${error.message}`);
                console.error(`Error in sendAnswer: ${error.message}`);
                throw error;
            }
        }),
});
