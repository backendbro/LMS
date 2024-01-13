import express from "express"
import { isAuthenticated, isAuthorized } from "../ultis/auth"
import { 
    createLayout, editLayout
 } from "../controller/LayoutController"
const LayoutRouter = express.Router()

LayoutRouter.post ("/create-layout", isAuthenticated, isAuthorized("admin"), createLayout)
LayoutRouter.put ('/edit-layout', isAuthenticated, isAuthorized("admin"), editLayout)

export default LayoutRouter 