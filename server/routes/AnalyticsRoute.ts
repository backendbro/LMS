import express from "express" 
import { isAuthenticated, isAuthorized } from "../ultis/auth"
const AnalyticsRouter = express.Router()
import { 
    getCoursesAnalytics,
    getOrdersAnalytics,
    getUsersAnalytics
 } from "../controller/AnalyticsController" 

 AnalyticsRouter.get("/get-users-analytics", isAuthenticated, isAuthorized("admin"), getUsersAnalytics)
 AnalyticsRouter.get("/get-courses-analytics", isAuthenticated, isAuthorized("admin"), getCoursesAnalytics)
 AnalyticsRouter.get("/get-orders-analytics", isAuthenticated, isAuthorized("admin"), getOrdersAnalytics)
 
 export default AnalyticsRouter 