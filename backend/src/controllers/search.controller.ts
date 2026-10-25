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

export async function searchEventPhotos(req: Request, res: Response){
try {
     const { eventId } = req.params;

// base64 string is a text format that turns binary data(like images, files) into safe string
// of letters and numbers
// react frontend will send the webcam capture as base64 string

     const { image } = req.body;

     // res status 400 is client side error for bad request
     // mostly enough data required is not provided in that case
     if(!image){
          return res.status(400).json({
               error:"No image entered"
          })
     }

     // 1. send selfie to python flask server (embed_server.py)
     // flask server decodes base64 ==> runs insightFace and returns the vector

     const embedResponse = await axios.post("http://localhost:5001/embed",{
          image: image
     });
     const embedding = embedResponse.data.embedding;

     if(!embedding){
          return res.status(400).json({error:"No face detected. Please try again."})
     }

     // convert array into string format that is expected by pgvector
     const vectorString = `[${embedding.join(',')}]`;

     /*
     postgres BASICS--
     <=> is cosine distance operator used primarily for vector similarity search
     via pgvector extension
     */

     //2. querying postgres for matches using vector cosine distance(<=>)
     // a distance of 0.6 is standard threshold for facial recognition matches
     const query = `
          SELECT s3_url, 1 - (embedding <=> $1::vector) as similarity
          FROM event_photos
          WHERE event_id = $2
          AND embedding <=> $1::vector < 0.6
          ORDER BY similarity DESC;
     `

     const result = await pool.query(query, [vectorString, eventId]);

     // 3. extracting only the s3 url to send back to the frontend

     const matchedPhotos = result.rows.map(row => row.s3_url);

     res.status(200).json({
          success: true,
          count: matchedPhotos.length,
          matches: matchedPhotos
     });
} catch (error) {
     console.error("Vector search error: ", error);
     res.status(500).json({error:"Failed to search for matching photos"})
}
}