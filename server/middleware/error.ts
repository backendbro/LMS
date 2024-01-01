import ErrorHandler from "../ultis/ErrorHandler"
import { NextFunction, Request, Response } from "express"

const ErrorMiddleWare = (err:any, req:Request, res:Response, next:NextFunction) => {
    err.statusCode = err.statusCode || 500 
    err.message = err.message || "Internal Server Error"

    // wrong MongoDB ID 
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    // duplicate key error 
    if (err.statusCode === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

    // wrong jwt error 
    if (err.name === "JsonWebTokenError") {
        const message = "Json web token is invalid, try again"
        err = new ErrorHandler(message, 400)
    }

    // jwt expired error 
    if (err.name === 'TokenExpireError') {
        const message = `Json web token is expired, try again`
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({ 
        success:false,
        message:err.message
    })
}

export default ErrorMiddleWare