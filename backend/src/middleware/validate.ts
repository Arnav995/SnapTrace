import { tryCatch } from "bullmq";
import { Request ,Response, NextFunction } from "express";
import z, { ZodError } from "zod";
import { query } from "../config/db";

export const validate = (schema: z.ZodType) =>{
     return(req:Request, res: Response, next: NextFunction)=>{
     try {
          schema.parse({
               body: req.body,
               query: req.query,
               params: req.params,
          });
          next();
     } catch (err) {
          if(err instanceof ZodError){
               res.status(400).json({
                    status: "fail",
                    errors: err.issues.map((e)=>{
                         field: e.path.join("."),
                         message: e.message
                    })
               })
          }
     }
     }
}