import { chatRouter } from './routers/chat.router';  // Import the chat router
import { postRouter } from './routers/post';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  // posts: postRouter
  //  Add other routers here, e.g.:
  //  posts: postRouter,
  //  users: userRouter,
});

export type AppRouter = typeof appRouter;