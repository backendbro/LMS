import UserModel from "../models/UserModel"
import { Response } from "express"
import {redis} from '../ultis/redis'

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