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

app.use(express.json({limit:"50mb"}))
app.use(cookieParser())
app.use(cors({
    origin:process.env.origin
}))


app.use('/api/v1', UserRouter)
app.use('/api/v1', CourseRouter)
app.use('/api/v1', OrderRouter)
app.use('/api/v1', NotificationRouter)


app.all("*", (req:Request, res:Response, next:NextFunction) => {
    const err = new Error (`Route ${req.originalUrl} not found`) as any 
    err.statusCode = 404 

    next(err)
})

app.use(ErrorMiddleWare)