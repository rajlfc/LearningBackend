import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id
    const videoLikeExists = await Like.find({
        $and: [{video: videoId}, {likedBy: userId}]
    })
    let likeData;
    if (videoLikeExists.length == 0) {
        likeData = await Like.create({
            video: videoId,
            likedBy: userId
        })
    } else {
        likeData = await Like.deleteOne(
            {
                _id: videoLikeExists[0]._id
            }
        )
    }
    return res.status(200).json(new ApiResponse(200,likeData, "Video like status changed successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id
    const commentLikeExists = await Like.find({
        $and: [{comment: commentId}, {likedBy: userId}]
    })
    let likeData;
    if (commentLikeExists.length == 0) {
        likeData = await Like.create({
            comment: commentId,
            likedBy: userId
        })
    } else {
        likeData = await Like.deleteOne(
            {
                _id: commentLikeExists[0]._id
            }
        )
    }
    return res.status(200).json(new ApiResponse(200,likeData, "comment like status changed successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id
    //TODO: toggle like on tweet
    const tweetLikeExists = await Like.find({
        $and: [{tweet: tweetId}, {likedBy: userId}]
    })
    let likeData;
    if (tweetLikeExists.length == 0) {
        likeData = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })
    } else {
        likeData = await Like.deleteOne(
            {
                _id: tweetLikeExists[0]._id
            }
        )
    }
    return res.status(200).json(new ApiResponse(200,likeData, "Tweet like status changed successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    const userLikeExists = await Like.find(
        {likedBy: userId}
    )
    let likedVideos;
    if (userLikeExists.length == 0) {
        return res.status(200).json(new ApiResponse(200,[],"No like has been found"))
    } else {
         likedVideos = await Like.aggregate([
            {
                $match: {
                    video: {
                        $exists: true
                    }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videosLiked",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                thumbnail: 1,
                                owner: 1,
                                createdAt: 1
                            },
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "likedVideoOwner",
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
            },
            {
                $addFields: {
                    "likevideos": {
                        $first: "$videosLiked"
                    }
                }
            },
            {
                $project: {
                    likevideos: 1
                }
            }
        ])
    }
    return res.status(200)
    .json(new ApiResponse(200,likedVideos, "Liked videos fetched successfully"))
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}