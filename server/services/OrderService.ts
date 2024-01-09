import { Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import OrderModel from "../models/OrderModel";

export const newOrder = catchAsyncError (async (data:any, res:Response, next:NextFunction) => {
    const order = await OrderModel.create(data)
    res.status(201).json({
        success:true,
        order
    })
})

export const getAllOrderService = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    const orders = await OrderModel.find().sort({createdAt:-1})
    res.status(200).json({
        success:true, 
        orders 
    })
})