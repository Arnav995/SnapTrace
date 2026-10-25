import dotenv from "dotenv"
dotenv.config();

import { Queue } from "bullmq"
export const photoQueue = new Queue('photo-processing', {
     connection:{
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
     },
});