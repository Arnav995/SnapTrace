import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
     PORT: z.string().default('5000'),
     DATABASE_URL: z.url(),
     REDIS_HOST: z.string().default('localhost'),
     REDIS_PORT: z.string().default('6379').transform(Number),
     AWS_REGION: z.string(),
     AWS_ACCESS_KEY_ID: z.string(),
     AWS_SECRET_ACCESS_KEY: z.string(),
     AWS_S3_BUCKET_NAME: z.string(),
})
export const env  = envSchema.parse(process.env);