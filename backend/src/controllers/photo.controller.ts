import { Request, Response, NextFunction } from "express";
import { generatePresignedUrl } from '../services/s3.service.js';
import { createPhotoRecord } from '../services/event.service.js';
import { photoQueue } from '../config/queue.js';

export async function handleGetUploadUrl (req: Request<{ id: string }>, res: Response, next: NextFunction){
try {
     const { id: eventId } = req.params;
     const {fileName, fileType } = req.body;

     const s3Key = `events/${eventId}/${Date.now()}_${fileName}`;
     const {uploadUrl, publicUrl } = await generatePresignedUrl(s3Key, fileType);

     const photoRecord = await createPhotoRecord(eventId, s3Key, publicUrl)

     await photoQueue.add('extract-embeddings',{
          photoId: photoRecord.id,
          eventId,
          s3Url: publicUrl,
     });

     res.status(200).json({
          status: 'success',
          data:{
               uploadUrl,
               photo: photoRecord,
          },
     });
} catch (error) {
     next(error);
}
}