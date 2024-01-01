import express from "express"
import { 
    registrationUser,
    activateUser,
    login,
    logoutUser,
    updateAccessToken
 } from "../controller/UserController"

 import { isAuthenticated, isAuthorized } from "../ultis/auth"

const UserRouter = express.Router()

UserRouter.post ('/register', registrationUser)
UserRouter.post ('/activate-user', activateUser)
UserRouter.post ('/login', login)
UserRouter.get ('/logout', isAuthenticated, logoutUser)
UserRouter.get ('/refresh-token', updateAccessToken)

export default UserRouter 