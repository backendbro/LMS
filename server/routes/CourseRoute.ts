import express from "express"
const CourseRouter = express.Router()

import { isAuthenticated, isAuthorized } from "../ultis/auth"
import { 
    editCourse,
    getSingleCourse,
    uploadCourse
 } from "../controller/CourseController"


CourseRouter.post ('/create-course', isAuthenticated, isAuthorized ("admin"), uploadCourse)
CourseRouter.put ('/edit-course/:id', isAuthenticated, isAuthorized ("admin"), editCourse)
CourseRouter.get ('/get-course/:id', getSingleCourse)

export default CourseRouter 