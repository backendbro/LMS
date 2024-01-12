import UserModel from "../models/UserModel"
import { NextFunction, Response } from "express"
import {redis} from '../ultis/redis'
import ErrorHandler from "../ultis/ErrorHandler"

export const getUserById = async (id:string, res:Response) => {
    //const user = await UserModel.findById(id)
    
    const userJson = await redis.get(id)
    if (userJson) {
        const user = JSON.parse(userJson)
        res.status(200).json ({
            success:true,
            user
        })
    }
}

export const getAllUsersService = async (res:Response) => {
    const users = await UserModel.find().sort({createdAt:-1})
    res.status(200).json({
        success:true, 
        users
    })
}

export const updateUserRoleService = async (res:Response, id:string, role:string, next:NextFunction
) => {
    let user = await UserModel.findById(id)
    if (!user) {
        return next ( new ErrorHandler ("User does not find", 400))
    }

    user = await UserModel.findByIdAndUpdate(id, {role}, {new:true})
    res.status(200).json({
        success:true, 
        user 
    })
}