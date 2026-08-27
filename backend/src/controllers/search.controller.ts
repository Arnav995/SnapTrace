import {Request, Response} from "express";
import { pool } from "../config/db.js"
import axios from "axios"
import { success } from "zod";

export async function searchGuestFaces(req: Request, res: Response){
try {
     const { eventId } = req.params;
     const { image } = req.body;
     
     if(!image){
          return res.status(400).json({
               error:"Selfie image data is required"
          });
     }

     // request 512-D vector embedding from local python ai embedding service
     // i.e. running lightweight embedding http service on port 5001

     const aiResponse = await axios.post("https://localhost:5001/embed", {image});

     const { vector } = aiResponse.data;

     if(!vector || vector.length !== 512){
          return res.status(400).json({error:"No clear face detected in the photo"});
     }


     //step2: now we send query to pgvector hnsw cosine distance index
     // threshold of 0.45 balences precision and recall for face matches

const query = `SELECT DISTINCT p.id AS photo_id, p.s3_url, (f.embeddings <=> $1::vector) AS distance
               FROM face_embeddings f
               JOIN photos p ON f.photo_id = p.id
               WHERE f.event_id = $2 AND (f.embedding <=> $1::vector) < 0.45
               ORDER BY distance ASC
               LIMIT 50
               `

     const vectorString = `[${vector.join(',')}]`;
     const { rows } = await pool.query(query, [vectorString, eventId]);

     res.status(200).json({
          success: true,
          matches: rows
     });
} catch (error) {
     console.error("Face Search Error", error);
     res.status(500).json({error: "Internal Server Error during search"})
}
}