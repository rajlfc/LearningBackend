import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { user } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const User = await user.findById(userId)
        const accessToken = User.generateAccessToken()
        const refreshToken = User.generateRefreshToken()
        User.refreshToken = refreshToken
        User.save({validateBeforeSave: false}) // Because when we are saving the refreshtoken in database, it automatically wants other required values like password. but we are not using password here, so we have written line 14 with validatebeforesave false

        return {accessToken,refreshToken}
    } catch(error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

const registeruser = asyncHandler( async (req,res) => {
    // res.status(200).json({
    //     message: "ok"
    // })
    // get user details
    // validation - not empty
    // check already user exists
    // check for images check for avatar
    // upload to cloudinary images
    // create user object - create db entry
    // remove password and refresh token field from response
    // check for user creation
    // return user response
    console.log(req.body)
    const {fullName,email,username,password} = req.body
    console.log("email", email)

    // validation
    // if (
    //     [fullName,email,username,password].some(() => field?.trim() === "")
    // ) {
    //     throw new ApiError(400, "All fields are compulsory")
    // }

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check already user exists

    const existedUser = await user.findOne({
        $or: [{username} , {email}] // or is actually checking like a condition whether email or username already exists or not.. findone is a mongodb method
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path // this path we are taking from multer local path. check user.router.js where we have written before calling registeruser, the multer middleware code
   // const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenth >0) {
        coverImageLocalPath = req.files.coverImage[0].path
   }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    // create user object - create DB entry
    const UserInfo = await user.create({
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase()
    })
    console.log("After creating database",user.refreshToken)
    // to check whether user has been created or not
    // User is coming from mongodb which gives a unique identifier _id and again findById is a method of mongoDB
    const createdUser = await user.findById(UserInfo._id).select(
        "-password -refreshToken" // this is we are giving because we dont need this fields in user response 
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler( async (req,res) => {
    // req body -> data
    // username or email there or not
    // find the user exists or not
    // password check
    // access and refresh token
    // send cookie

    const {email,username,password} = req.body

    if (!(username || email)) {
        throw new ApiError(400,"username or email is required")
    }

    // check user exists or not
    const existsUser = await user.findOne({
        $or: [{username},{email}]
    })

    if (!existsUser) {
        throw new ApiError(404,"User does not exist")
    }

    // password check

    const isPasswordValid = await existsUser.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"Password incorrect")
    }

    // access token/ refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(existsUser._id)

    
    const loggedinUser = await user.findById(existsUser._id).select("-password -refreshToken")

    // send cookies embedded with this data

    // Our cookies can be modified by anyone in frontend. But using options httpOnly: true it can only be modified by server
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200, {
            user: loggedinUser, accessToken, refreshToken
        }, "User loggedin Successfully")
    )
    // we are sending accesstoken, refreshtoken inside cookie, and inside json also, because for mobile applications, we dont have cookie and it may be the case developer needs the access,refresh token, so we are sending those in response
})

const logoutUser = asyncHandler(async (req,res) => {
    // clear out the cookies
    // clear out the refresh token

    // Now while logging out, we dont have the access to the user database, i mean in terms of login or signup, we are giving the email,password,username and then we are checking with the req body but in logout we cant give email password to logout manually, otherwise it will logout any user, so we have to think of some way

    // We have created a middleware auth.middleware.js for this
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler (async (req,res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
   if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
   }
   try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
    const User = await user.findById(decodedToken?._id)
    if (!User) {
     throw new ApiError(401, "Invalid refresh token")
    }
 
    if (incomingRefreshToken !== User?.refreshToken) {
     throw new ApiError(401, "Refresh token is expired or used")
    }
    const options = {
     httpOnly: true,
     secure: true
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(User._id)
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", newRefreshToken,options)
    .json(
     new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Token refreshed successfully")
    )
   } catch (error) {
        throw new ApiError(401, error?.message || "Token refrshed failed")
   }
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body
    const User = await user.findById(req.user?._id)
    const isPasswordCorrect = await User.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    User.password = newPassword
    await User.save({validateBeforeSave: false})

    return res.status(200)
              .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res.status(200)
    .json(new ApiResponse(200,req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler( async(req,res) => {
    const {fullName, email} = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "All fields are required")
    }

    const User = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")
    return res.status(200).json(new ApiResponse(200, User, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler (async (req,res) => {

    // as we are just needing avatar image, so we are using req.file not files
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar files is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading on avatar")
    }

    // req.avatar = avatar.url
    // await req.user.save({validateBeforeSave: false})
    const User = await user.findByIdAndUpdate(
        req.user._id,
        {
            $set: {avatar: avatar.url}
        },
        {
            new: true
        }
    ).select("-password")
    return res
            .status(200)
            .json(new ApiResponse(200,User, "Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler (async (req,res) => {

    // as we are just needing avatar image, so we are using req.file not files
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar files is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading on avatar")
    }

    // req.avatar = avatar.url
    // await req.user.save({validateBeforeSave: false})
    const User = await user.findByIdAndUpdate(
        req.user._id,
        {
            $set: {coverImage: coverImage.url}
        },
        {
            new: true
        }
    ).select("-password")

    return res
            .status(200)
            .json(new ApiResponse(200,User, "Cover image updated successfully"))
})

export {registeruser,loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,updateUserCoverImage}