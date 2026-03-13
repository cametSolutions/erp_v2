import React from 'react'
import { MoonLoader } from "react-spinners";

function CustomMoonLoader({ size = 40, fullScreen = true }) {
  return (
    <div className={fullScreen ? "flex h-screen items-center justify-center" : "flex items-center justify-center"}>
      <MoonLoader size={size} />
    </div>
  )
}

export default CustomMoonLoader
