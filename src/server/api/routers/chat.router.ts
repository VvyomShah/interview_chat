import { createTRPCRouter } from '../trpc';
import { getAllConversationsController } from '../controllers/getAllConversationController'
import { startConversationController } from '../controllers/startConversationController';
import { getConversationController } from '../controllers/getConversationController';
import { sendAnswerController } from '../controllers/sendAnswerController';


export const chatRouter = createTRPCRouter({
    getAllConversations: getAllConversationsController,
    startConversation: startConversationController,
    getConversation: getConversationController,
    sendAnswer: sendAnswerController
});
