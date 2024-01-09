require('dotenv').config()
import {Response, Request, NextFunction} from "express"
import UserModel, {IUser} from "../models/UserModel"
import ErrorHandler from "../ultis/ErrorHandler"
import {catchAsyncError} from "../middleware/catchAsyncError"
import jwt, {Secret, JwtPayload} from "jsonwebtoken"
import sendMail from "../ultis/SendEmail"
import sendToken, { accessTokenOptions, refreshTokenOptions } from "../ultis/jwt"
import {redis} from '../ultis/redis'
import { getAllUsersService, getUserById } from "../services/User.service"
import cloudinary from "cloudinary"

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
                template:"activation-mail.ejs",
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
            return next(new ErrorHandler (error.message, 500))
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

        req.user = user

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


export const getUserInfo = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    
    try {
        const userId = req.user?._id
        getUserById(userId, res)
    } catch (error) {
         if (error instanceof Error) {
            return next ( new ErrorHandler (error.message, 500))
         }
    }
})

interface ISocialAuth{
    email:string,
    name:string,
    avatar:string
}

export const socialAuth = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {email, name, avatar} = req.body as ISocialAuth
        const user = await UserModel.findOne({email})
      
        if(!user) {
            const newUser = await UserModel.create({email, name, avatar})
            sendToken(newUser, 200, res)
        }else {
            sendToken(user, 200, res)
        }
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

interface IUpdateUserInfo {
    name?:string,
    email?:string 
}

export const updateUserInfo = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {name, email} = req.body as IUpdateUserInfo 
        const userId = req.user?._id 

        const user = await UserModel.findById(userId)
        if (email && user) {
            const isEmailExist = await UserModel.findOne({email})
            if(isEmailExist) {
                return next (new ErrorHandler ("Email already exists", 400))
            }
            
            user.email = email
        }

        if (name && user) {
            user.name = name 
        }

        await user?.save()
        await redis.set(userId, JSON.stringify(user))

        res.status(201).json({
            success:true, 
            user
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

interface IUpdatePassword {
    oldPassword:string,
    newPassword:string
}

export const updatePassword = catchAsyncError (async (req:Request, res:Response, next: NextFunction) => {
    try {
        const {oldPassword, newPassword} = req.body as IUpdatePassword

        if (!oldPassword || !newPassword) {
            return next (new ErrorHandler ("Please enter a password", 400))
        }

        const user = await UserModel.findById(req.user?._id).select("+password")
        
        if (user?.password === undefined) {
            return next (new ErrorHandler ("Invalid User", 400))
        }

        const isPasswordMatch = await user?.comparePassword(oldPassword)
        if (!isPasswordMatch) {
            return next (new ErrorHandler ('Invalid Old Password', 400))
        }

        user.password = newPassword
        await user.save()

        await redis.set(req.user?._id, JSON.stringify(user))
        res.status(201).json({
            success:true,
            user 
        })

    } catch (error) {
        if (error instanceof Error) {
            return next ( new ErrorHandler (error.message, 400))
        }
    }
})

interface IUpdateProfilePicture {
    avatar:string 
}

export const updateProfilePicture = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {avatar} = req.body as IUpdateProfilePicture

        const user = await UserModel.findById(req.user?._id)
        if (avatar && user) {
            if(user?.avatar.public_id) {
                await cloudinary.v2.uploader.destroy(user?.avatar.public_id)

                const myCloudImage = await cloudinary.v2.uploader.upload(avatar, {
                    folder:"avatars",
                    width:150,
                })
    
                user.avatar = {
                    public_id: myCloudImage.public_id,
                    url:myCloudImage.secure_url
                }
            }else {
                const myCloudImage = await cloudinary.v2.uploader.upload(avatar, {
                    folder:"avatars",
                    width:150,
                })
    
                user.avatar = {
                    public_id: myCloudImage.public_id,
                    url:myCloudImage.secure_url
                }
            }
        }

        await user?.save() 
        await redis.set(user?.id, JSON.stringify(user))

        res.status(200).json ({
            success:true,
            user 
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})


export const getAllUsers = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        getAllUsersService(res)
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})