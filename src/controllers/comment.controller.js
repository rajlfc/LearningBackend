import mongoose, { Mongoose } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    const newComment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })
    const createdComment = await Comment.findById(newComment._id).select("-updatedAt")
    if (!createdComment) {
        throw new ApiError(400, "Uploading comment failed")
    }
    const video = await Video.findById(videoId)
    const videoOwner = await User.findById(video.owner)
    const user =  await User.findById(req.user._id)
    const commentInfo = await Comment.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $addFields: {
                "videoOwner": videoOwner.username,
                "commentOwner": user.username
            }
        },
        {
            $project: {
                content: 1,
                videoOwner: 1,
                commentOwner: 1
            }
        }
    ])
    console.log("Final response", commentInfo)
    return res.status(200).json(new ApiResponse(200,commentInfo, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {new: true}
    )
    const comment = await Comment.findById(commentId)
    const video = await Video.findById(comment.video)
    const videoOwner = await User.findById(video.owner)
    const user =  await User.findById(req.user._id)
    const updatedComment = await Comment.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $addFields: {
                "videoOwner": videoOwner.username,
                "commentOwner": user.username
            }
        },
        {
            $project: {
                content: 1,
                videoOwner: 1,
                commentOwner: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment has been updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const ownerId = req.user._id

    const commentExists = await Comment.find({
        $and: [{_id: commentId},{owner: ownerId}]
    })
    if (commentExists.length == 0) {
        throw new ApiError(400, "Comment cant be deleted")
    }
    const deletedComment = await Comment.deleteOne({
        _id: commentExists[0]._id
    })

    return res.status(200).json(new ApiResponse(200,deletedComment,"Your comment is deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }