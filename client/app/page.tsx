"use client" 
import React, {FC, useState} from "react"
import Heading from "./utils/Heading"

interface Props {} 

const Page: FC<Props> = (props) => {
  return (
      <div>
        <Heading 
        title="Elearning"
        description="Elearning is a platform for real niggas to come together and make money"
        keywords="Programming, Nodejs, ML, TensorFlow"
        />
      </div>
  )
}

export default Page 