import { z } from "zod"

export const generateUploadUrlSchema = z.object({
     params: z.object({
          id: z.uuid({message:"Invalid Event UUID"})
     }),
     body: z.object({
          fileName: z.string().min(1, 'File name is required'),
          fileType: z.string().min(1, 'File type is required')
     })
})