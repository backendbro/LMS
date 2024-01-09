import {Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../ultis/ErrorHandler";
import OrderModel, { IOrder } from "../models/OrderModel";
import UserModel from "../models/UserModel";
import CourseModel from "../models/CourseModel";
import { newOrder } from "../services/OrderService";
import ejs from "ejs"
import path from "path"
import sendMail from "../ultis/SendEmail";
import NotificationModel from "../models/NotificationModel";

export const createOrder = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {courseId, payment_info} = req.body as IOrder
        const user = await UserModel.findById(req.user?._id)
        const courseExistInUser = user?.courses.some((course:any) => course._id.toString() === courseId)
        
        if (courseExistInUser) {
            return next (new ErrorHandler ("You have already purchased this course", 400))
        }
        
        // rememeber to check if the buyer is a normal user 
        const course = await CourseModel.findById(courseId) 
        if (!course) {
            return next (new ErrorHandler ("Course not found", 400))
        }
        
        const data:any = {
            courseId: course._id,
            userId: user?._id,
            payment_info
        }
        
        const mailData = {
                _id:course._id.toString().slice(0,6),
                name:course.name,
                price: course.price, 
                date: new Date().toLocaleDateString('en-US', {
                    year:"numeric",
                    month:"long",
                    day:"numeric"
                })
        }

        const html = await ejs.renderFile(path.join(__dirname, "../email-template/order-mail.ejs"), {order: mailData})
        
        try {
            if (user) {
                await sendMail({
                    email:user.email, 
                    subject: "Order Confirmation",
                    template:"order-mail.ejs",
                    data:mailData
                })
            }
        } catch (error) {
            if (error instanceof Error) {
                return next (new ErrorHandler (error.message, 500))
            }
        }

        user?.courses.push(course?._id)
        await user?.save()

        const notification = await NotificationModel.create ({
            userId: req.user?._id, 
            title:"New Order", 
            message:`You have a new order from ${course?.name}`
        })
    
        // if (course.purchased){   
        //     course.purchased += 1 
        // }

    

       await CourseModel.findOneAndUpdate(course._id, {$inc:{ purchased:1}}, {new:true})

        await course.save()
        newOrder(data, res, next) 

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})