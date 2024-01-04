require('dotenv').config()
import express, { NextFunction, Request, Response } from "express"
export const app = express()

import cors from "cors"
import cookieParser from "cookie-parser"

import ErrorMiddleWare from './middleware/error'

import UserRouter from "./routes/UserRoute"
import CourseRouter from "./routes/CourseRoute"


app.use(express.json({limit:"50mb"}))
app.use(cookieParser())
app.use(cors({
    origin:process.env.origin
}))


app.use('/api/v1', UserRouter)
app.use('/api/v1', CourseRouter)

app.get('/test', (req:Request,res:Response) => {
    res.status(200).json({message:"Hello world"})
})

app.all("*", (req:Request, res:Response, next:NextFunction) => {
    const err = new Error (`Route ${req.originalUrl} not found`) as any 
    err.statusCode = 404 

    next(err)
})

app.use(ErrorMiddleWare)