import { Request, Response, NextFunction } from "express";
import { createEvent, getEventById} from "../services/event.service.js"
import { tryCatch } from "bullmq";
import { pool } from "../config/db.js";
export async function handleCreateEvent(req: Request,
                                        res: Response, 
                                        next: NextFunction)
{
try {
     const  { title } = req.body;
     const event = await createEvent(title);
     res.status(201).json({
          status: 'success',
          data: event
     })

} catch (error) {
     next(error);
}
}

export async function handleGetEvent(req: Request<{id: string}>, res: Response, next: NextFunction){
try {
     const { id } = req.params;

     const event = await getEventById(id);

     if(!event){
          return res.status(404).json({
               status: "fail",
               message: "Event not found",
          });
     }
     res.status(200).json({
          status: "fail",
          message: "Event not found"
     });

} catch (error) {
     next(error);
}
};

export async function getEvents(req:Request, res:Response){
try{
     const { rows } = await pool.query('SELECT * FROM events ORDER BY created_at DESC');

     res.status(200).json({
          events: rows
     })
} catch(err){
     res.status(500).json({error: "Failed to fetch events"})
}
}