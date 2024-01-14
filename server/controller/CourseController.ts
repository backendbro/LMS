import {Request, Response, NextFunction} from "express"
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import cloudinary from "cloudinary"
import {
    createCourse, getAllCourseService
} from "../services/CourseService"
import CourseModel from "../models/CourseModel"
import { redis } from "../ultis/redis"
import mongoose from "mongoose"
import ejs from "ejs"
import path from "path"
import sendMail from "../ultis/SendEmail"
import NotificationModel from "../models/NotificationModel"

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

        await redis.set(courseId, JSON.stringify(course), 'EX', 604800)
        
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
        
        await NotificationModel.create({
            user: req.user?._id, 
            title:"New Question Recieved", 
            message:`You have a new question in ${courseContent?.title}`
        })
        
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
            await NotificationModel.create ({
                user: req.user?._id, 
                title:"New Question Reply Received", 
                message:`You have a new question reply in ${courseContent.title}`
            })
        }else {
            const data = {
                name:question.user.name,
                title:courseContent.title 
            }
         

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

interface IReviewData {
    review:string,
    rating:number,
    userId:string 
}

export const addReview = catchAsyncError( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {review, rating} = req.body as IReviewData
        const userCourseList = req.user?.courses 
        const courseId = req.params.id 

        const courseExists = userCourseList?.some((course:any) => course._id.toString() === courseId)
        if (!courseExists) {
            return next (new ErrorHandler ("You are not eligible for this course", 400))
        }

        const course = await CourseModel.findById(courseId) 
        
        const reviewData:any = {
            user:req.user,
            comment:review,
            rating 
        }

        course?.reviews.push(reviewData)
        
        //remember to put a cap on how much rating a user can give
        // also ensure that user cannot add more than 1 review

        let avg = 0 
        course?.reviews.forEach((rev:any) => {
            avg += rev.rating 
        })

        if (course) {
            course.ratings = avg / course.reviews.length 
        }

        await course?.save()

        const notification = {
            title: "New review recieved",
            message:`${req.user?.name} has given a review in ${course?.name}`
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

interface IAddReviewData {
    comment:string,
    courseId:string,
    reviewId:string 
}

export const addReplyToReview = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {comment, courseId, reviewId} = req.body as IAddReviewData 
        const course = await CourseModel.findById(courseId)
        
        if (!course) {
            return next (new ErrorHandler ("Course not found", 400))
        }

        const review = course?.reviews?.find((rev:any) => rev._id.toString() === reviewId)
        if (!review) {
            return next (new ErrorHandler ("Review not found", 400))
        }

        const replyData:any = {
            user:req.user, 
            comment 
        }

        review.commentReplies?.push(replyData)
        await course.save()

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

export const getAllCoursesAdmin = catchAsyncError  ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        getAllCourseService(req, res, next)
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }   
    }
})

export const deleteCourse = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {id} = req.params 
        const course = await CourseModel.findById(id) 

        if (!course) {
            return next (new ErrorHandler ("Course not found", 400))
        }

        await course.deleteOne({id}) 
        await redis.del(id) 

        res.status(200).json({
            success:true,
            message:"Course deleted successfully"
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})