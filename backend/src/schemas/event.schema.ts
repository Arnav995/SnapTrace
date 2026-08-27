import { z } from "zod";

export const createEventSchema = z.object({
     body: z.object({
          title: z.string().min(1, 'Title is Required').max(255),
     })
});

export const getEventParamsSchema = z.object({
     params: z.object({
          id: z.uuid({message: 'invalid event uuid'})
     })   
});