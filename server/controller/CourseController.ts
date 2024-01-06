import {Request, Response, NextFunction} from "express"
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import cloudinary from "cloudinary"
import {
    createCourse
} from "../services/CourseService"
import CourseModel from "../models/CourseModel"
import { redis } from "../ultis/redis"
import mongoose from "mongoose"
import ejs from "ejs"
import path from "path"
import sendMail from "../ultis/SendEmail"

export const uploadCourse = catchAsyncError (async (req:Request,res:Response,next:NextFunction) => {
    try {
        const data = req.body 
        const thumbnail = data.thumbnail 
        
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder:"courses"
            })

            data.thumbnail = {
                public_id:myCloud.public_id,
                url:myCloud.secure_url
            }
        }

        createCourse(data, res, next)

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const editCourse = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const data = req.body 
        const courseId = req.params.id 
        const thumbnail = data.thumbnail 

        if (thumbnail) {
            await cloudinary.v2.uploader.destroy(thumbnail.public_id)

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder:"courses"
            })

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url 
            }
        }

        const course = await CourseModel.findByIdAndUpdate(courseId, data, {new:true})
        res.status(201).json({
            success:true,
            course  
        })

    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const getSingleCourse = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const courseId = req.params.id 
        
        const isCacheExist = await redis.get(courseId)
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist) 
            
            return res.status(200).json({
                success:true,
                course
            })
        }else {
        
        const course = await CourseModel.findById(courseId).
        select(" -courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")

        await redis.set(courseId, JSON.stringify(course))
        
        res.status(200).json({
            success:true,
            course
        })

    }
    } catch (error) {
        if (error instanceof Error) {
            return next ( new ErrorHandler (error.message, 500))
        }
    }
})

export const getAllCourses = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const ifCacheExist = await redis.get("allCourses")
        if (ifCacheExist) {
            const course = JSON.parse(ifCacheExist)
            res.status(200).json({
                success:true,
                course
            })
        }else {

        const courses = await CourseModel.find()
        .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")

        await redis.set("allCourses", JSON.stringify(courses))

        res.status(200).json({
            success:true,
            courses
        })
    }
    } catch (error) {
        if (error instanceof Error ){
            return next ( new ErrorHandler (error.message, 500))
        }
    }
})

export const getCourseByUser = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const userCourseList = req.user?.courses 
        
        const courseId = req.params.id 
        
        const courseExists = userCourseList?.find((course:any) => course._id.toString() === courseId)
        if (!courseExists) {
            return next (new ErrorHandler("You are not eligible to access this course", 404))
        }

        const course = await CourseModel.findById(courseId)
        const courseContent = course?.courseData 

        res.status(200).json({
            success:true, 
            courseContent
        })

    } catch (error) {
        if (error instanceof Error ){
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

interface IAddQuestions {
    question:string,
    courseId:string,
    contentId:string 
}

export const addQuestions = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {question, courseId, contentId}: IAddQuestions = req.body
        const course = await CourseModel.findById(courseId)
        
        if (!mongoose.Types.ObjectId.isValid(contentId)){
            return next (new ErrorHandler ("Invalid Content ID", 400))
        }

        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))
        if (!courseContent) {
            return next (new ErrorHandler ("Invalid content id", 400))
        }

        const newQuestions:any = {
            user:req.user,
            question,
            questionReplies:[]
        }
        
        courseContent.questions.push(newQuestions)
        await course?.save()

        res.status(200).json({
            success:true,
            course
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

interface IAddAnswerData {
    answer:string,
    courseId:string,
    contentId:string,
    questionId:string 
}

export const addAnswer = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {

        // check if the all users have access to this course

        const {answer, courseId, contentId, questionId}: IAddAnswerData = req.body
        const course = await CourseModel.findById(courseId)
        
        if (!mongoose.Types.ObjectId.isValid(contentId)){
            return next (new ErrorHandler ("Invalid Content ID", 400))
        }

        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))
        if (!courseContent) {
            return next (new ErrorHandler ("Invalid content id", 400))
        }

        const question =  courseContent?.questions?.find((item: any) => item._id.equals(questionId))
        if (!question) {
            return next (new ErrorHandler ("Invalid question id", 400))
        }

        const newAnswer:any = {
            user:req.user,
            answer  
        }

        question.questionReplies.push(newAnswer) 
        await course?.save() 

        if (req.user?.id === question.user._id) {
            // send a notification to the owner of the questions that it has been answered
        }else {
            const data = {
                name:question.user.name,
                title:courseContent.title 
            }

            console.log(data.name)
            
          const html = await ejs.renderFile(path.join(__dirname + "../email-template/question-reply.ejs"), data)
            
            try {
                await sendMail({
                    email:question.user.email,
                    subject:"Question Reply",
                    template:"question-reply.ejs",
                    data
                })
            } catch (error) {
                if (error instanceof Error){
                    return next ( new ErrorHandler(error.message, 500))
                }
            }
        }


        res.status(200).json({
            success:true,
            course
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
}) 

