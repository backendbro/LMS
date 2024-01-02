require('dotenv').config()
import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import ErrorMiddleWare from './middleware/error'
import UserRouter from "./routes/UserRoute"
export const app = express()


app.use(express.json({limit:"50mb"}))
app.use(cookieParser())
app.use(cors({
    origin:process.env.origin
}))


app.use('/api/v1', UserRouter)

app.get('/test', (req:Request,res:Response) => {
    res.status(200).json({message:"Hello world"})
})

app.all("*", (req:Request, res:Response, next:NextFunction) => {
    const err = new Error (`Route ${req.originalUrl} not found`) as any 
    err.statusCode = 404 

    next(err)
})

app.use(ErrorMiddleWare)