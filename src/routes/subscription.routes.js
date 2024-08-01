import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getSubscribedChannels) //to return channel list to which user has subscribed
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers); //to return subscriber list of a channel

export default router