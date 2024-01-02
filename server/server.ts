import { app } from "./app";
import dotenv from "dotenv"
import connectDB from "./database/db";
import {v2 as cloudinary} from "cloudinary"

dotenv.config()
connectDB()

cloudinary.config({
    cloud_name:process.env.cloudinary_name,
    api_key:process.env.cloudinary_api_key,
    api_secret:process.env.cloudinary_api_secret
})

const port = process.env.port 
app.listen (port, () => {
    console.log(`port started on localhost:${port}`)
})