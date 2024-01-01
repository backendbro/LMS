import mongoose from "mongoose"
require('dotenv').config()

const dburl:string = process.env.mongoDbUrl || ""

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(dburl)
        console.log(`mongodb database connected: ${conn.connection.host}`)
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message)
        }
        setTimeout(connectDB, 5000)   
    }
}

export default connectDB; 