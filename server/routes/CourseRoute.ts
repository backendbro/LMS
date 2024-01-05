import express from "express"
const CourseRouter = express.Router()

import { isAuthenticated, isAuthorized } from "../ultis/auth"
import { 
    addAnswer,
    addQuestions,
    editCourse,
    getAllCourses,
    getCourseByUser,
    getSingleCourse,
    uploadCourse
 } from "../controller/CourseController"


CourseRouter.post ('/create-course', isAuthenticated, isAuthorized ("admin"), uploadCourse)
CourseRouter.put ('/edit-course/:id', isAuthenticated, isAuthorized ("admin"), editCourse)
CourseRouter.get ('/get-course/:id', getSingleCourse)
CourseRouter.get  ('/get-courses', getAllCourses)
CourseRouter.get ('/get-course-content/:id', isAuthenticated, getCourseByUser)
CourseRouter.put ('/add-question', isAuthenticated, addQuestions)
CourseRouter.put ('/add-answer', isAuthenticated, addAnswer)

export default CourseRouter 