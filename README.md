# Interview Chat

This is a Interview Chat Bot.

## Stack

T3 Stack - NextJS, TS, Tanstack Query, tRPC, Tailwind, Prisma, Zod, SQLite

## To run a pre-built docker container
1. Add your `OPENAI_API_KEY` to `.env`

2. 
```bash
docker-compose -f docker-prebuilt-yml up
```

## To build from source

```bash
docker-compose build
docker-compose up
```

## To edit interview scipt

Edit `/src/server/utils/requestConstants.ts`