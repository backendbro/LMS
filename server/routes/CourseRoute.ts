import express from "express"
const CourseRouter = express.Router()

import { isAuthenticated, isAuthorized } from "../ultis/auth"
import { 
    addAnswer,
    addQuestions,
    addReplyToReview,
    addReview,
    deleteCourse,
    editCourse,
    getAllCourses,
    getAllCoursesAdmin,
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
CourseRouter.put ('/add-review/:id', isAuthenticated, addReview)
CourseRouter.put ("/add-review-reply", isAuthenticated, isAuthorized("admin"),addReplyToReview)
CourseRouter.get ("/get-courses-admin", isAuthenticated, isAuthorized("admin"), getAllCoursesAdmin)
CourseRouter.put ("/delete-course/:id", isAuthenticated, isAuthorized("admin"), deleteCourse)

export default CourseRouter 