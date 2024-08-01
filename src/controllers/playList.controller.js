import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playList.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videos} = req.body
    const userId = req.user._id
    //TODO: create playlist
    const createdPlaylist = await Playlist.create({
        name: name,
        description: description,
        videos: videos,
        owner: userId
    })
    const createdPlaylistExists = await Playlist.findById(createdPlaylist._id)
    if (!createdPlaylistExists) {
        throw new ApiError(500,"Error while creating playlist")
    }
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    _id : new mongoose.Types.ObjectId(createdPlaylist._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200,responsePlaylist[0],"Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const searchPlaylist = await Playlist.find(
        {owner: req.user._id}
    )
    if (searchPlaylist.length == 0) {
        throw new ApiError(400,"No playlist found")
    }
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200,responsePlaylist[0],"Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const searchPlaylistById = await Playlist.findById(playlistId)
    if (!searchPlaylistById) {
        throw new ApiError(400, "No playlist found")
    }
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200,responsePlaylist[0],"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    await Playlist.updateOne(
        {_id: playlistId},
        {$push: {"videos": videoId}}
    )
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200, responsePlaylist[0], "Video in playlist added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const deletedPlaylist = await Playlist.updateOne(
        {_id: playlistId},
        {$pull: {videos: {$eq: videoId}}}
    )
    console.log(deletedPlaylist)
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200, responsePlaylist[0],"Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "No playlist found with this id")
    }
    const deletedPlaylist = await Playlist.deleteOne(
        {
            _id: playlistId
        }
    )
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200, responsePlaylist[0], "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )
    const responsePlaylist = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }  
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerOfPlaylist",
                    pipeline: [
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    "owner": {
                        "$first": "$ownerOfPlaylist"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    videoDetails: 1,
                    ownerOfPlaylist: 1
                }
            }
        ]
    )
    return res.status(200).json(new ApiResponse(200, responsePlaylist[0], "Video in playlist added successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}