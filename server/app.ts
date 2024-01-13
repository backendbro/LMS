require('dotenv').config()
import express, { NextFunction, Request, Response } from "express"
export const app = express()

import cors from "cors"
import cookieParser from "cookie-parser"

import ErrorMiddleWare from './middleware/error'

import UserRouter from "./routes/UserRoute"
import CourseRouter from "./routes/CourseRoute"
import OrderRouter from "./routes/OrderRoute"
import NotificationRouter from "./routes/NotificationRoute"
import AnalyticsRouter from "./routes/AnalyticsRoute"
import LayoutRouter from "./routes/LayoutRoute"

app.use(express.json({limit:"50mb"}))
app.use(cookieParser())
app.use(cors({
    origin:process.env.origin
}))


app.use('/api/v1', 
    UserRouter, 
    CourseRouter, 
    OrderRouter, 
    NotificationRouter,
    AnalyticsRouter,
    LayoutRouter
    )


app.all("*", (req:Request, res:Response, next:NextFunction) => {
    const err = new Error (`Route ${req.originalUrl} not found`) as any 
    err.statusCode = 404 

    next(err)
})

app.use(ErrorMiddleWare)