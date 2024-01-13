import { Schema, model, Model, Document } from "mongoose" 

interface FaqItem extends Document {
    question:string, 
    answer:string 
}

interface Category extends Document {
    title:string 
}

interface BannerImage extends Document {
    public_id:string, 
    url:string 
}

interface Layout extends Document {
    type:string 
    faq:FaqItem[],
    categories:Category[],
    banner:{
        image: BannerImage,
        title:string, 
        subTitle:string 
    }
}

const FaqSchema = new Schema <FaqItem> ({
    question:String, 
    answer:String 
})

const CatergorySchema = new Schema <Category> ({
    title:String 
})

const BannerImageSchema = new Schema <BannerImage> ({
    public_id:String, 
    url:String 
})

const LayoutSchema = new Schema <Layout> ({
    type:String, 
    faq:[FaqSchema], 
    categories:[CatergorySchema],
    banner:{
        image: BannerImageSchema,
        title:String, 
        subTitle:String 
    }
}, {timestamps:true})

const LayoutModel:Model <Layout> = model <Layout> ('Layout', LayoutSchema)
export default LayoutModel