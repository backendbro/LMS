import {Request, Response, NextFunction} from "express"
import { catchAsyncError } from "../middleware/catchAsyncError"
import ErrorHandler from "../ultis/ErrorHandler"
import cloudinary from "cloudinary"
import LayoutModel from "../models/LayoutModel"

export const createLayout = catchAsyncError(async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {type} = req.body 
        const isExist = await LayoutModel.findOne({type}) 
        if (isExist) {
            return next (new ErrorHandler (`${type} Layout already exist!`, 400))
        }

        switch(type) {
            case "Banner": 
                const {image, title, subTitle} = req.body 
                const myCloud = await cloudinary.v2.uploader.upload (image, {
                    folder:"layout"
                })

                const banner = {
                    type, 
                    image:{
                        public_id:myCloud.public_id, 
                        url:myCloud.secure_url 
                    }, 
                    title, 
                    subTitle 
                }

                await LayoutModel.create({type, banner})
                break;
            
            case "FAQ":
                const {faq} = req.body 
                await LayoutModel.create({type, faq}) 
                    break; 
            
            case "Categories":
                const {categories} = req.body 
                await LayoutModel.create({type, categories})
                    break; 

            default: 
                return res.status(400).json({
                    success:false, 
                    message:"Something went wrong"
                })
            }
     

        res.status(200).json({
            success:true, 
            message:"Layout created successfully"
        })
      
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error.message, 500))
        }
    }
})

export const editLayout = catchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
  try {
    const {type} = req.body

    switch (type) {
        case "Banner": 
            const {image, title, subTitle} = req.body 
            const bannerData = await LayoutModel.findOne({type})
            if(!bannerData) {
                return next (new ErrorHandler ("No banner found", 400))
            }
            console.log(bannerData)
            await cloudinary.v2.uploader.destroy(bannerData.banner.image.public_id) 
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder:"layout"
            })

            const banner = {
                type:"Banner", 
                image:{
                    public_id:myCloud.public_id, 
                    url:myCloud.secure_url 
                }, 
                title, 
                subTitle 
            }

            await LayoutModel.findByIdAndUpdate(bannerData.id, {banner}, {new:true})
            break; 

        case "FAQ": 
            const {faq} = req.body 
            const faqData = await LayoutModel.findOne({ type }) 

            if (!faqData) {
                return next (new ErrorHandler ("No faqData found", 400))
            }

            await LayoutModel.findByIdAndUpdate(faqData.id, {faq}, {new:true})
            break; 

        case "Categories":
            const {categories} = req.body 
            const categoriesData = await LayoutModel.findOne({type}) 

            if (!categoriesData) {
                return next (new ErrorHandler ("No categories found", 400))
            }

            await LayoutModel.findByIdAndUpdate(categoriesData.id, {categories}, {new:true})
            break; 
    
    
        default: 
            return res.status(400).json({
                success:true, 
                message:"Something went wrong!"
            })
        }

        res.status(200).json({
            success:true, 
            message:"Layout edited successfully"
        })
  } catch (error) {
    if (error instanceof Error) {
        return next (new ErrorHandler (error, 500))
    }
  }  
})

export const getLayoutByType = catchAsyncError ( async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {type} = req.body
        const layout = await LayoutModel.findOne({ type })
        if(!layout) {
            return next (new ErrorHandler (`No ${type} Layout found`, 400))
        }

        res.status(200).json({
            success:true, 
            layout 
        })
    } catch (error) {
        if (error instanceof Error) {
            return next (new ErrorHandler (error, 500))
        }
    }
})