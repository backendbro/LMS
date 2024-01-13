import {Request, Response, NextFunction} from "express" 
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import { generateLastTweMonthData } from "../ultis/analytics"
import UserModel from "../models/UserModel"
import CourseModel from "../models/CourseModel"
import OrderModel from "../models/OrderModel"

export const getUsersAnalytics = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const users = await generateLastTweMonthData(UserModel) 
        res.status(200).json({
            success:true, 
            users 
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const getCoursesAnalytics = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const courses = await generateLastTweMonthData (CourseModel) 
        res.status(200).json({
            success:true, 
            courses
        })        
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const getOrdersAnalytics = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const orders = await generateLastTweMonthData (OrderModel) 
        res.status(200).json({
            success:true, 
            orders
        })        
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})
