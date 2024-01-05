import {Request, Response, NextFunction} from "express"
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import cloudinary from "cloudinary"
import {
    createCourse
} from "../services/CourseService"
import CourseModel from "../models/CourseModel"

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

export const editCourse = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const data = req.body 
        const courseId = req.params.id 
        const thumbnail = data.thumbnail 

        if (thumbnail) {
            await cloudinary.v2.uploader.destroy(thumbnail.public_id)

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder:"courses"
            })

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url 
            }
        }

        const course = await CourseModel.findByIdAndUpdate(courseId, data, {new:true})
        res.status(201).json({
            success:true,
            course  
        })

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const getSingleCourse = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const courseId = req.params.id 
        const course = await CourseModel.findById(courseId).
        select(" -CourseData.videoUrl -CourseData.suggestion -CourseData.questions -CourseData.links")

        res.status(200).json({
            success:true,
            course
        })
    } catch (error) {
        if (error instanceof Error) {
            return next ( new ErrorHandler (error.message, 500))
        }
    }
})