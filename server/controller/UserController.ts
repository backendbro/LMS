require('dotenv').config()
import {Response, Request, NextFunction} from "express"
import UserModel, {IUser} from "../models/UserModel"
import ErrorHandler from "../ultis/ErrorHandler"
import {catchAsyncError} from "../middleware/catchAsyncError"
import jwt, {Secret, JwtPayload} from "jsonwebtoken"
import sendMail from "../ultis/SendEmail"
import sendToken, { accessTokenOptions, refreshTokenOptions } from "../ultis/jwt"
import {redis} from '../ultis/redis'

interface IRegistrationBody {
    name:string,
    email:string,
    password:string,
    avatar?:string 
}

export const registrationUser = catchAsyncError(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {name, email, password} = req.body 
        const isEmailExist = await UserModel.findOne({email})
        if (isEmailExist) {
            return next( new ErrorHandler ("Email already exists", 400))
        }

        const user:IRegistrationBody = {
            name, email, password 
        }

        const activationToken = createActivationToken(user)
        const activationCode = activationToken.activationCode

        const data = {
            user: {
                name:user.name 
            },
            activationCode 
        }

        // const html = await ejs.renderFile(
        //     path.join(__dirname, "../email-template/activation-mail.ejs"),
        //     data 
        //     )


        try {
            await sendMail({
                email:user.email,
                subject:"Activate your account",
                data
            })

            res.status(200).json({
                success:true,
                message:`Please check your email: ${user.email} to activate your account`,
                activationToken: activationToken.token
            })
        } catch (error) {
            if (error instanceof Error) {
                return next (new ErrorHandler (error.message, 500))
            }
        }

    } catch (error) {
        if (error instanceof Error){
            return next(new ErrorHandler (error.message, 400))
        }
    }
})

interface IActivationToken {
    token:string,
    activationCode:string 
}

export const createActivationToken = (user:any):IActivationToken => {
    const activationCode = Math.floor( 1000 + Math.random () * 9000).toString()
    const token = jwt.sign ({user, activationCode}, process.env.JWT_SECRET as Secret, {expiresIn: process.env.JWT_EXPIRE})
    
    return {token, activationCode}
}

interface IActivateRequest{
    activation_token:string,
    activation_code:string 
}

export const activateUser = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) =>{
    try {
        const {activation_token, activation_code} = req.body as IActivateRequest 

        const newUser: {user:IUser; activationCode:string} = jwt.verify(
            activation_token,
            process.env.JWT_SECRET as Secret 
        ) as {user:IUser; activationCode:string}
            

        if (newUser.activationCode !== activation_code) {
            return next (new ErrorHandler ("Invalid activation code", 404))
        }

        const {name, email, password} = newUser.user 
        const existUser = await UserModel.findOne({email})

        if(existUser) {
            return next (new ErrorHandler ("Email already exists", 400))
        }

        const user = await UserModel.create ({
            name, email, password 
        })

        res.status(201).json ({
            success:true,
            user 
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

interface ILoginDetails {
    email:string, 
    password:string
}

export const login = catchAsyncError(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {email, password} = req.body as ILoginDetails
        if (!email || !password) {
            return next (new ErrorHandler ("Enter email and password", 400))
        }

        const user = await UserModel.findOne({email}).select("+password")
        if(!user) {
            return next (new ErrorHandler ("Invalid Email or password", 400))
        }

        const isPasswordMatch = await user.comparePassword(password)
        if(!isPasswordMatch) {
            return next (new ErrorHandler ("Invalid password", 404))
        }

        sendToken(user, 200, res)
        

    } catch (error) {
        if (error instanceof Error){
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const logoutUser = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    
    try {
        res.cookie("access_token", "", {maxAge:1})
        res.cookie("refresh_token", "", {maxAge:1})

        const userId = req.user?._id || " "
        redis.del(userId)

        res.status(200).json({
            success:true,
            message:"Logged out successfully"
        })

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const updateAccessToken = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token

        if(!refresh_token) {
            return next (new ErrorHandler("User is not authenticated", 404))
        }
    
        const decoded = jwt.verify(refresh_token, process.env.refresh_token as Secret) as JwtPayload

        
        if (!decoded) {
            return next (new ErrorHandler("Invalid refresh token", 400))
        }

        const session = await redis.get(decoded.id as string)
        if (!session) {
            return next (new ErrorHandler ('Could not get access token', 404))
        }
  
        const user = JSON.parse(session)

        

        const accessToken = jwt.sign({id: user._id}, process.env.access_token as Secret, {
            expiresIn:"5m"
        })

        const refreshToken = jwt.sign({id: user._id}, process.env.refresh_token as Secret, {
            expiresIn:"3d"
        })

        res.cookie("access_token", accessToken, accessTokenOptions)
        res.cookie("refresh_token", refreshToken, refreshTokenOptions)

        res.status(200).json({
            success:true,
            message:accessToken
        })

    } catch (error) {
        if (error instanceof Error){
            return next (new ErrorHandler (error.message, 500))
        }
    }
})