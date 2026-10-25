import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4} from "uuid";
import { s3Client } from "../config/s3";
import { tryCatch } from "bullmq";
import { error } from "node:console";
import { success } from "zod";
import { Queue } from "bullmq";

import { pool } from "../config/db"

const BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;

export async function generateBatchPresignedUrls(req: Request, res: Response){
try {
     const { eventId } = req.params;
     const { files } = req.body;// expecting {filename:"", fileType:""}

     if(!files || files.length() === 0){
          return res.status(400).json({
               error:"No files provided"
          });
     }

     // generating urls concurrently for the best speed
     const uploadInstructions = await Promise.all(
          files.map(async(file: {fileName: string; fileType: string})=>{
               const photoId= uuidv4();
               const objectKey = `events/${eventId}/${photoId}-${file.fileName}`;

// PutObject command is an AWS S3 command used to upload a file into an AWS S3 Bucket


               const command = new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: objectKey,
                    ContentType: file.fileType
               });

               // generate 15 min presigned url
               // 900secs = 15 min
               const uploadUrl = await getSignedUrl(s3Client, command, {expiresIn: 900})

               return{
                    photoId,
                    objectKey,
                    uploadUrl,
               publicUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`
               };
          })
     );
     res.status(200).json({
          success: true,
          data: uploadInstructions
     })
} catch (error) {
     console.error("Presigned URL Error: ", error);
     res.status(500).json({
          error:"Failed to generate upload URLs"
     })
}
}

const photoQueue = new Queue('photo-processing',{
     connection:{host: 'localhost', port: 6379}
});

export async function confirmUploads(req:Request, res:Response){
try {
     const { eventId } = req.params;
     const { uploadedPhotos } = req.body;

     // this region later is gonna be used for postgresql metadata photos table
     const client = await pool.connect();
     try {
          await client.query('BEGIN');

          // insert all photos into the database
          for(const photo of uploadedPhotos){
               await client.query(`INSERT INTO photos(id, event_id, s3_url) VALUES($1,$2,$3)`,
                    [photo.photoId, eventId, photo.publicUrl]
               );
          }
          await client.query('COMMIT');

     } catch (dberror) {
          await client.query('ROLLBACK');
          throw dberror;
     }finally{
          client.release();
     }

     // push each uploaded photo into redisQueue for python
     const jobs = uploadedPhotos.map((photo: any)=>({
          name: "process-face",
          data:{
               photoId: photo.photoId,
               eventId: eventId,
               s3Url: photo.publicUrl
          }
     }));

     await photoQueue.addBulk(jobs);

     res.status(200).json({
          success: true,
          message: "Photos queued for AI processing"
     })
} catch (err) {
     console.error("Confirmation Error: ", err)
     res.status(500).json({
          error:"Failed to process uploads"
     })
}
}
