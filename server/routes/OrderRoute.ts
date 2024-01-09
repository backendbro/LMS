import express from "express"
const OrderRouter = express.Router()
import {isAuthenticated, isAuthorized} from "../ultis/auth"
import { 
    createOrder, getAllOrderAdmin
 } from "../controller/OrderController"

OrderRouter.post ('/create-order', isAuthenticated, createOrder)
OrderRouter.get ('/get-orders-admin', isAuthenticated, isAuthorized("admin"), getAllOrderAdmin)

export default OrderRouter 