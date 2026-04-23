import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import AppError from "../errors/AppError.js";
import asyncHandler from "./asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieAccessToken = req.cookies?.accessToken;

  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (cookieAccessToken) {
    token = cookieAccessToken;
  }

  if (!token) {
    throw new AppError("Authentication required. No token provided.", 401);
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
    issuer: "melodia-api",
    audience: "melodia-client",
  });

  const user = await userModel.findById(decoded.id).select("-password");

  if (!user) {
    throw new AppError("User belonging to this token no longer exists.", 401);
  }

  req.user = user;
  next();
});

export default authenticate;
