import {NextFunction, Response} from "express"
import CourseModel from "../models/CourseModel"
import { catchAsyncError } from "../middleware/catchAsyncError"

export const createCourse = catchAsyncError (async (data:any, res:Response) => {
    const course = await CourseModel.create(data) 
    res.status(201).json({
        success:true,
        course 
    })
})

export const getAllCourseService = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    const courses = await CourseModel.find().sort({createdAt:-1})
    res.status(200).json ({
        success:true, 
        courses
    })
})