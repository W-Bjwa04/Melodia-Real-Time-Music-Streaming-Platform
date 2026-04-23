import crypto from "crypto";
import userModel from "../models/user.model.js";
import refreshTokenModel from "../models/refreshToken.model.js";
import storageService from "../services/storage.service.js";
import logger from "../config/logger.js";
import AppError from "../errors/AppError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import sendTokens from "../utils/sendTokens.js";

const registerUser = asyncHandler(async (req, res) => {
    const { name, username, email, password, role = "listener" } = req.body;

    if (!name || !username || !email || !password) {
        throw new AppError("Please provide all required fields", 400);
    }

    const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
        const field = existingUser.email === email ? "email" : "username";
        throw new AppError(`This ${field} is already registered`, 409);
    }

    let profilePicture = "";
    if (req.file?.path) {
        const profilePictureName = `${Date.now()}-${req.file.originalname}`;
        const uploadResponse = await storageService.uploadFile(req.file.path, profilePictureName);
        profilePicture = uploadResponse?.url || "";
    }

    const user = await userModel.create({
        name,
        username,
        email,
        password,
        role,
        profilePicture,
    });

    logger.info("New user registered", { username, email, role });

    return ApiResponse.created(res, "Account created successfully", {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
    });
});

const loginUser = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        throw new AppError("Please provide username/email and password", 400);
    }

    const user = await userModel
        .findOne({ $or: [{ username: identifier }, { email: identifier }] })
        .select("+password");

    if (!user || !(await user.comparePassword(password))) {
        logger.warn("Failed login attempt", { identifier, ip: req.ip });
        throw new AppError("Invalid credentials", 401);
    }

    logger.info("User logged in", { userId: user._id, username: user.username });

    return sendTokens(user, res, req, "Login successful");
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.refreshToken;

    if (!rawToken) {
        throw new AppError("Refresh token not found. Please log in again.", 401);
    }

    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const storedToken = await refreshTokenModel.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
    }).populate("user");

    if (!storedToken || !storedToken.user) {
        throw new AppError("Invalid or expired refresh token. Please log in again.", 401);
    }

    await refreshTokenModel.findByIdAndDelete(storedToken._id);

    logger.info("Access token refreshed", { userId: storedToken.user._id });

    return sendTokens(storedToken.user, res, req, "Token refreshed successfully");
});

const logoutUser = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.refreshToken;

    if (rawToken) {
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        await refreshTokenModel.findOneAndDelete({ token: hashedToken });
    }

    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.clearCookie("accessToken", { path: "/" });

    logger.info("User logged out", { userId: req.user?._id || "unauthenticated" });

    return ApiResponse.success(res, "Logged out successfully", null, 200);
});

const getMe = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user._id).select("-password");

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return ApiResponse.success(res, "User profile fetched", {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        notificationsEnabled: user.notificationsEnabled,
        createdAt: user.createdAt,
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user._id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const { name, username, email } = req.body;

    if (username && username !== user.username) {
        const exists = await userModel.findOne({ username, _id: { $ne: user._id } });
        if (exists) {
            throw new AppError("Username is already taken", 409);
        }
        user.username = username;
    }

    if (email && email !== user.email) {
        const exists = await userModel.findOne({ email, _id: { $ne: user._id } });
        if (exists) {
            throw new AppError("Email is already taken", 409);
        }
        user.email = email;
    }

    if (name) {
        user.name = name;
    }

    if (req.file?.path) {
        const profilePictureName = `${Date.now()}-${req.file.originalname}`;
        const uploadResponse = await storageService.uploadFile(req.file.path, profilePictureName);
        user.profilePicture = uploadResponse?.url || user.profilePicture;
    }

    await user.save();

    return ApiResponse.success(res, "Profile updated", {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        notificationsEnabled: user.notificationsEnabled,
    });
});

const logoutAllSessions = asyncHandler(async (req, res) => {
    await refreshTokenModel.deleteMany({ user: req.user._id });

    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.clearCookie("accessToken", { path: "/" });

    return ApiResponse.success(res, "Logged out from all sessions", null);
});

export default {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getMe,
    updateProfile,
    logoutAllSessions,
};