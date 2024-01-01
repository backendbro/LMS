require('dotenv').config()
import mongoose, {Document, Model, Schema} from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const emailRegexPattern:RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export interface IUser extends Document {
    name:string, 
    email:string,
    password:string,
    avatar:{
        public_id:string,
        url:string 
    },
    role:string,
    isVerified:boolean,
    courses:Array<{courseId: string}>,
    comparePassword: (password:string) => Promise<boolean>,
    SignAccessToken:() => string,
    SignRefreshToken:() => string 
}

const UserSchema: Schema<IUser> = new mongoose.Schema({
    name:{
        type:String,
        required:true 
    },
    email:{
        type:String,
        required:[true, 'Please enter a valid email'], 
        validate:{
            validator:function(value:string) {
                return emailRegexPattern.test(value)
            },
            message:"Please enter a valid email"
        },
        unique:true
    },
    password:{
        type:String,
        required:[true, 'Please enter your password'],
        minlength:[6, 'Password must be at least 6 characters'],
        select:false 
    },
    avatar:{
        public_id:String,
        url:String 
    },
    role:{
        type:String,
        default:"User"
    },
    isVerified:{
        type:Boolean,
        default:false 
    },
    courses:[
        {
            courseId:String
        }
    ]
}, {
    timestamps:true 
})

UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')){
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

UserSchema.methods.SignAccessToken = function () {
    return jwt.sign({id:this._id}, process.env.access_token || "", {
        expiresIn:'5m'
    })
}

UserSchema.methods.SignRefreshToken = function () {
    return jwt.sign({id: this._id}, process.env.refresh_token || "", {
        expiresIn:'3d'
    })
}

UserSchema.methods.comparePassword = async function (enteredPassword:string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password)
}; 


const UserModel:Model<IUser> = mongoose.model("User", UserSchema)

export default UserModel
