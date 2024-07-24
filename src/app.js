import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public")) // uses the public folder that we have created to store image, pdf etc

app.use(cookieParser()) //we have added this because we can access cookie in response as you see in login function inside user.controller.js, we can access cookies with request also

// routes import
import router from './routes/user.routes.js'
console.log("coming request")
// routes declaration
app.use("/api/v1/users", router)

export default app