import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import musicRoutes from "./routes/music.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import searchRoutes from "./routes/search.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import artistRoutes from "./routes/artist.routes.js";
import userRoutes from "./routes/user.routes.js";
import httpLogger from "./middlewares/httpLogger.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import AppError from "./errors/AppError.js";
import { getNotificationNamespace } from "./socket/index.js";

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.18.11:5173',
  "https://melodia-streaming.netlify.app",
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Body parsers + cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. HTTP request logging
app.use(httpLogger);

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/songs", musicRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/users", userRoutes);

// Temporary socket verification route — remove after testing
app.get("/api/socket-test", (req, res) => {
  const nsp = getNotificationNamespace();
  if (!nsp) return res.status(503).json({ error: "Socket not initialized" });
  nsp.emit("test_ping", { message: "Socket is working", time: new Date() });
  res.json({ success: true, message: "test_ping emitted to all /notifications clients" });
});

// 6. 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// 7. Global error handler — must be last
app.use(errorMiddleware);

export default app;