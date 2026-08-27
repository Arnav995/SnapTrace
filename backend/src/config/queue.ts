import { Queue } from "bullmq"
export const photoQueue = new Queue('photo-processing', {
     connection:{
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
     },
});