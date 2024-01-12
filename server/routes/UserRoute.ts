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
    updateProfilePicture,
    getAllUsers,
    updateUserRole,
    deleteUser
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
UserRouter.get ("/get-users-admin", isAuthenticated, isAuthorized("admin"), getAllUsers)
UserRouter.put ("/update-user-role", isAuthenticated, isAuthorized("admin"), updateUserRole)
UserRouter.delete ("/delete-user/:id", isAuthenticated, isAuthorized("admin"), deleteUser)

export default UserRouter 