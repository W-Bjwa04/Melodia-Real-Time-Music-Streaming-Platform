import "dotenv/config"
import http from "http"
import app from "./app.js"
import connectDB from "./db/db.js"
import logger from "./config/logger.js"
import { initSocket } from "./socket/index.js"

connectDB()

const PORT = process.env.PORT || 3000
const server = http.createServer(app)
export const io = initSocket(server)
console.log('[Socket.IO] Initialized and listening')

server.listen(PORT,'0.0.0.0', () => {
    logger.info("Server started", {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        pid: process.pid,
    })
})

process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION - shutting down", {
        message: err.message,
        stack: err.stack,
    })
    process.exit(1)
})

process.on("unhandledRejection", (reason) => {
    logger.error("UNHANDLED PROMISE REJECTION", {
        reason: reason?.message || reason,
        stack: reason?.stack,
    })
    process.exit(1)
})
