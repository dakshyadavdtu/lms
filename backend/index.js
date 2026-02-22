import express from "express"
import dotenv from "dotenv"
import connectDb from "./configs/db.js"
import authRouter from "./routes/authRoute.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import userRouter from "./routes/userRoute.js"
import courseRouter from "./routes/courseRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import aiRouter from "./routes/aiRoute.js"
import reviewRouter from "./routes/reviewRoute.js"
dotenv.config()

let port = process.env.PORT
let app = express()
app.use(express.json())
app.use(cookieParser())
const frontendOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "https://novalearn-ejzh.onrender.com";
app.use(cors({
    origin: frontendOrigin,
    credentials: true
}))
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/course", courseRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/ai", aiRouter)
app.use("/api/review", reviewRouter)


app.get("/", (req, res) => {
    res.send("Hello From Server")
})

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})

app.listen(port , ()=>{
    console.log("Server Started")
    connectDb()
})


