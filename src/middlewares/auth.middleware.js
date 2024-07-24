import { user } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req,res, next) => {
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
     if (!token) {
         throw new ApiError(401,"Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     const User = await user.findById(decodedToken?._id).select("-password -refreshToken")
 
     if (!User) {
         // TODO: Discuss about front end
         throw new ApiError(401, "Invalid access token")
     }
 
     req.user = User
     next()
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
   }
})