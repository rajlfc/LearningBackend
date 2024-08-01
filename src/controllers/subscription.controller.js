import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id
    // TODO: toggle subscription
    const subscriberExists = await Subscription.find({
        $and: [{channel: channelId}, {subscriber: subscriberId}]
    })
    console.log(subscriberExists)
    let subscriptionData;
    if (subscriberExists.length == 0) {
        subscriptionData = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
    } else {
        subscriptionData = await Subscription.deleteOne(
            {
                _id: subscriberExists[0]._id
            }
        )
    }
    return res.status(200).json(new ApiResponse(200, subscriptionData, "Channel subscription status changed successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $group: {
                _id: subscriberId,
                subscriberCount: {$sum: 1}
            }
        }
    ])
    console.log("subscribers are.", subscriberList)
    if (subscriberList.length > 0) {
        return res.status(200).json(new ApiResponse(200, subscriberList[0], "Number of subscriber list fetched successfully"))
    } else {
        const newResponse = [{
            _id: subscriberId,
            subscriberCount: 0
        }]
        return res.status(200).json(new ApiResponse(200, newResponse[0], "Number of subscriber list fetched successfully"))
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    const subscribedToList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: channelId,
                subscribedToCount: {$sum: 1}
            }
        }
    ])
    if (subscribedToList.length > 0) {
        return res.status(200).json(new ApiResponse(200, subscribedToList[0], "Number of subscriber list fetched successfully"))
    } else {
        const newResponse = [{
            _id: subscriberId,
            subscribedToCount: 0
        }]
        return res.status(200).json(new ApiResponse(200, newResponse[0], "Number of subscribed to channel list fetched successfully"))
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}