import {Request, Response, NextFunction} from "express"
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "./ErrorHandler"
import jwt, {Secret, JwtPayload} from "jsonwebtoken"
import { redis } from "./redis"



export const isAuthenticated = catchAsyncError(async (req:Request, res:Response, next:NextFunction) => {
  
    const access_token = req.cookies.access_token

    if(!access_token) {
        return next (new ErrorHandler("User is not authenticated", 404))
    }

    const decoded = jwt.verify(access_token, process.env.access_token as Secret) as JwtPayload
    if(!decoded){
        return next (new ErrorHandler ("Access token is not valid", 404))
    }

    const user = await redis.get(decoded.id as string) 
    

    if(!user) {
        return next (new ErrorHandler ("User not found", 404))
    }

    req.user = JSON.parse(user)
    next()
})

export const isAuthorized = (...roles:string[]) => {
    return (req:Request, res:Response, next:NextFunction) => {
        if(!roles.includes(req.user?.role || "")) {
            return next (new ErrorHandler (`Role ${req.user?.role} is not authorized to complete this action`, 404))
        }

        next()
    } 
}