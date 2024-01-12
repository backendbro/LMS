import {Request, Response, NextFunction} from "express" 
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import { generateLastTweMonthData } from "../ultis/analytics"
import UserModel from "../models/UserModel"

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