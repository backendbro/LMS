import express from "express"
import { 
    registrationUser,
    activateUser,
    login,
    logoutUser,
    updateAccessToken,
    getUserInfo,
    socialAuth,
    updateUserInfo,
    updatePassword,
    updateProfilePicture
 } from "../controller/UserController"

 import { isAuthenticated, isAuthorized } from "../ultis/auth"

const UserRouter = express.Router()

UserRouter.post ('/register', registrationUser)
UserRouter.post ('/activate-user', activateUser)
UserRouter.post ('/login', login)
UserRouter.get ('/logout', isAuthenticated, logoutUser)
UserRouter.get ('/refresh-token', updateAccessToken)
UserRouter.get ('/me', isAuthenticated, getUserInfo)
UserRouter.post ('/social-auth', socialAuth)
UserRouter.put ('/update-user-info', isAuthenticated, updateUserInfo)
UserRouter.put ('/update-user-password', isAuthenticated, updatePassword)
UserRouter.put ('/update-user-avatar', isAuthenticated, updateProfilePicture)

export default UserRouter 