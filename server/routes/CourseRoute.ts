import express from "express"
const CourseRouter = express.Router()

import { isAuthenticated, isAuthorized } from "../ultis/auth"
import { 
    uploadCourse
 } from "../controller/CourseController"


CourseRouter.post ('/create-course', isAuthenticated, isAuthorized ("admin"), uploadCourse)

export default CourseRouter 