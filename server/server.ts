import { app } from "./app";
import dotenv from "dotenv"
import connectDB from "./database/db";

dotenv.config()
connectDB()

const port = process.env.port 
app.listen (port, () => {
    console.log(`port started on localhost:${port}`)
})