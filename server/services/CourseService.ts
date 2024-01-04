import {Response} from "express"
import CourseModel from "../models/CourseModel"
import { catchAsyncError } from "../middleware/catchAsyncError"

export const createCourse = catchAsyncError (async (data:any, res:Response) => {
    const course = await CourseModel.create(data) 
    res.status(201).json({
        success:true,
        course 
    })
})