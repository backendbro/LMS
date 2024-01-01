import { Redis } from "ioredis";
require('dotenv').config() 

const redisClient = () => {
    if (process.env.redis_url){
        return process.env.redis_url
    }

    throw new Error (`Redis connection failed`)
}

export const redis = new Redis(redisClient())