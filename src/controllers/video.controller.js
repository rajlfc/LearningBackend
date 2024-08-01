
import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, uploadVideoOnCloudinary} from "../utils/cloudinary.js"

const getVideoOwner = async(userId) => {
    const user = await User.findById(userId)
    const username = user.username
    return {username}
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pageNumber = Number(page)
    const limitNumber = Number(limit)
    const skip = (page - 1) * limit
    const allVideos = await Video.find()
    const totalNumberOfVideos = allVideos.length
    const videoResponse = await Video.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "videoOwner",
                pipeline: [
                    {
                        $project: {
                            username: 1
                        }
                    }
                ]
            },
        },
        {
            $addFields: {
                "ownerOfVideo": {
                    $first: "$videoOwner"
                }
            }
        },
        {
            $skip: skip
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                ownerOfVideo: 1
            }
        }
    ])
   return res.status(200)
   .json(new ApiResponse(200,
     {
        allVideos: videoResponse, totalNumberOfVideos
     }, 
     "All the videos fetched successfully"))
})

// completed
const publishAVideo = asyncHandler(async (req, res) => {
    console.log("posting a video")
    const { title, description} = req.body
    const ownerDetails = await User.findById(req.user._id)//.select("-password -refrshToken -createdAt -updatedAt -watchHistory")
    // TODO: get video, upload to cloudinary, create video
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    const video = await uploadVideoOnCloudinary(videoFileLocalPath)
    if (!video) {
        throw new ApiError(500, "Error in uploading video to cloudinary")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(500, "Error in uploading thumbnail to cloudinary")
    }
    const videoInfo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: video.duration,
        owner: ownerDetails
    })
    const createdVideo = await Video.findById(videoInfo._id)
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while publishing the video")
    }
   // const {username} = await createVideoOwner(videoInfo._id,req.user._id)
    return res.status(200)
    .json(new ApiResponse(200,createdVideo,"video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    //console.log(videoId)
    const video = await Video.findById(videoId)
    console.log(video)
    return res.status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully for corresponding id"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body
    const thumbnailPath = req.file?.path
    let thumbnail;
    if (thumbnailPath) {
        thumbnail = await uploadOnCloudinary(thumbnailPath)
    }
    const newVideoInfo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnail.url
            }
        },{
            new: true
        }
    )
    return res.status(200).json(new ApiResponse(200, newVideoInfo, "Video infomration updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    console.log(videoId)
    const video = await Video.findById(videoId)
    const isPublishedStatus = video.isPublished
    console.log(isPublishedStatus)
    const newToggledVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !isPublishedStatus
            }
        },
        {new: true}
    )

    return res.status(200).json(new ApiResponse(200, newToggledVideo,"Video toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
