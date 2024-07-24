import { Router } from "express";
import { loginUser, logoutUser, registeruser, refreshAccessToken,changeCurrentPassword, updateAccountDetails, getCurrentUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/register").post(
    // upload is coming from multer, fields is a property of multer where we are passing name and maxcount like how many avatar image is required. name = "avatar" this avatar name has to be same when coming from frontend request body
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registeruser
)
router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post( verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
export default router