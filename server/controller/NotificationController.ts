import { NextFunction, Response, Request } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import NotificationModel from "../models/NotificationModel";
import ErrorHandler from "../ultis/ErrorHandler";

export const getNotifications = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const notifications = await NotificationModel.find().sort({createdAt:-1})
        if (notifications.length === 0) {
            return next (new ErrorHandler ("No notification found", 400))
        }
        res.status(200).json({
            success:true,
            notifications
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const updateNotification = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        let notification = await NotificationModel.findById(req.params.id)
        if(!notification) {
            return next (new ErrorHandler ("No notification found", 400))
        } 

        notification = await NotificationModel.findByIdAndUpdate(req.params.id, {status:"read"}, {new:true})
        const allNotifs = await NotificationModel.find().sort({createdAt:-1})

        res.status(200).json({
            success:true, 
            allNotifs 
        })

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

