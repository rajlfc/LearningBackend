import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const createdTweet = await Tweet.create({
        content,
        owner: req.user._id
    })
    const tweetExists = await Tweet.findById(createdTweet._id)
    if (!tweetExists) {
        throw new ApiError(400, "Uploading tweet failed")
    }
    const user = await User.findById(req.user._id)
    const responseTweet = await Tweet.aggregate([
        {
            $match: {
                _id: createdTweet._id
            }
        },
        {
            $addFields: {
                "tweetOwner": user.username
            }
        },
        {
            $project: {
                content: 1,
                tweetOwner: 1,
                createdAt: 1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, responseTweet, "Tweet published successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    const isTweetExists = await Tweet.findById(tweetId)

    if (!isTweetExists) {
        throw new ApiError(400, "No tweet found")
    }
    const user = await User.findById(req.user._id)
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    const responseTweet = await Tweet.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $addFields: {
                "tweetOwner": user.username
            }
        },
        {
            $project: {
                content: 1,
                tweetOwner: 1,
                createdAt: 1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, responseTweet, "Tweet Updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const ownerId = req.user._id

    const isTweetExists = await Tweet.find({
        $and: [{_id: tweetId},{owner: ownerId}]
    })
    if (!isTweetExists) {
        throw new ApiError(400, "Tweet deletion failed")
    }
    const deletedTweet = await Tweet.deleteOne({
        _id: isTweetExists[0]._id
    })
    return res.status(200).json(new ApiResponse(200, deletedTweet[0], "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}