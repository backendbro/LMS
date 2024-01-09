import express from "express";
const NotificationRouter = express.Router()
import { 
    getNotifications, updateNotification
 } from "../controller/NotificationController";
import { isAuthenticated, isAuthorized } from "../ultis/auth";

NotificationRouter.get("/get-all-notifications", isAuthenticated, isAuthorized("admin"), getNotifications)
NotificationRouter.put ("/update-notification/:id", isAuthenticated, isAuthorized("admin"), updateNotification)

export default NotificationRouter 