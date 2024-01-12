import express from "express" 
import { isAuthenticated, isAuthorized } from "../ultis/auth"
const AnalyticsRouter = express.Router()
import { 
    getUsersAnalytics
 } from "../controller/AnalyticsController" 

AnalyticsRouter.get("/get-users-analytics", isAuthenticated, isAuthorized("admin"), getUsersAnalytics)

export default AnalyticsRouter 