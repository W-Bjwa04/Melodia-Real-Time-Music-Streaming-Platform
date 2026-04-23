import AppError from "../errors/AppError.js";
import asyncHandler from "./asyncHandler.js";

const checkArtistRole = asyncHandler(async (req, res, next) => {
    if (req.user.role !== "artist") {
        throw new AppError("Forbidden: Only artists can perform this action", 403);
    }
    next();
});

export default checkArtistRole;