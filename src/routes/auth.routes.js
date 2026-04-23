import express from 'express';
import authController from '../controllers/auth.controller.js';
import upload from "../middlewares/multer.middleware.js";
import authenticate from "../middlewares/authenticate.js";
import { authLimiter } from "../middlewares/authLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, upload.single("profilePicture"), authController.registerUser);
router.post("/login",    authLimiter, authController.loginUser);
router.post("/refresh",  authController.refreshAccessToken);
router.post("/logout",   authenticate, authController.logoutUser);
router.post("/logout-all", authenticate, authController.logoutAllSessions);
router.get("/me",        authenticate, authController.getMe);
router.patch("/me",      authenticate, upload.single("profilePicture"), authController.updateProfile);

export default router;