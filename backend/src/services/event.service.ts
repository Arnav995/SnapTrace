import { query } from "../config/db";

export async function createEvent(title: string){
     const result = await query(
          `INSERT INTO events (title) VALUES ($1) RETURNING *`,
          [title]
     );
     return result.rows[0];
}
export async function getAllEvents(id: string){
     const eventRes = await query(`SELECT * FROM events where id = $1`, [id]);

     if(eventRes.rows.length === 0){
          return null;
     }

     const photoRes = await query(`SELECT * FROM photos WHERE event_id=$1 ORDER BY created_at DESC`)

     return{
          ...eventRes.rows[0],
          photos: photoRes.rows,
     };
}
export async function getEventById(id: string){
     const eventRes = await query(
          `SELECT * FROM events WHERE id = $1`,
          [id]
     )

     if(eventRes.rows.length === 0) return null;

     const photoRes= await query(
          `SELECT * FROM photos WHERE event_id=$1 ORDER BY created_at DESC`,[id]
     )

     return{
          ...eventRes.rows[0],
          photos: photoRes.rows,
     };
}

export async function createPhotoRecord(id: string, event_id: string, s3Url: string){
     const result = await query(
          `INSERT INTO photos (id, event_id, s3_url) VALUES ($1, $2, $3) RETURNING *`
     , [id,event_id, s3Url]);

     return result.rows[0];
}
