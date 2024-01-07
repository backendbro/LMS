import express from "express"
const OrderRouter = express.Router()
import {isAuthenticated} from "../ultis/auth"
import { 
    createOrder
 } from "../controller/OrderController"

OrderRouter.post ('/create-order', isAuthenticated, createOrder)

export default OrderRouter 