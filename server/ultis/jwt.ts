require('dotenv').config()
import {Response, Request, NextFunction} from "express"
import {IUser} from "../models/UserModel"
import {redis} from './redis'

interface ITokenOptions {
    expires:Date,
    maxAge:number,
    httpOnly:boolean,
    sameSite:"lax" | "strict" | "none" | undefined 
    secure?:boolean 
}

const accessTokenExpires = parseInt(process.env.access_token_expires || "300", 10)
const refreshTokenExpires = parseInt(process.env.refresh_token_expires || "1200", 10)

export const accessTokenOptions:ITokenOptions = {
    expires:new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
    maxAge:accessTokenExpires * 60 * 60 * 1000,
    httpOnly:true,
    sameSite:"lax"
}


export const refreshTokenOptions:ITokenOptions = {
    expires:new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
    maxAge:refreshTokenExpires * 24 * 60 * 60 * 1000,
    httpOnly:true,
    sameSite:"lax"
}

const sendToken = (user:IUser, statusCode:number, res:Response) => {
    const accessToken = user.SignAccessToken()
    const refreshToken = user.SignRefreshToken() 

    redis.set(user._id, JSON.stringify(user) as any)


    if (process.env.NODE_ENV === 'production'){
        accessTokenOptions.secure = true 
        refreshTokenOptions.secure = true 
    }

    res.cookie("access_token", accessToken, accessTokenOptions)
    res.cookie("refresh_token", refreshToken, refreshTokenOptions)


    res.status(statusCode).json({
        success:true,
        user,
        accessToken
    })
}

export default sendToken