import {Request, Response, NextFunction} from "express"
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import cloudinary from "cloudinary"
import {
    createCourse
} from "../services/CourseService"

export const uploadCourse = catchAsyncError (async (req:Request,res:Response,next:NextFunction) => {
    try {
        const data = req.body 
        const thumbnail = data.thumbnail 
        
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder:"courses"
            })

            data.thumbnail = {
                public_id:myCloud.public_id,
                url:myCloud.secure_url
            }
        }

        createCourse(data, res, next)

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

