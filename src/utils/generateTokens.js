import jwt from "jsonwebtoken";
import crypto from "crypto";
import refreshTokenModel from "../models/refreshToken.model.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      issuer: "melodia-api",
      audience: "melodia-client",
    }
  );
};

export const generateRefreshToken = async (user, ip, userAgent) => {
  const rawToken = crypto.randomBytes(64).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshTokenModel.findOneAndDelete({ user: user._id, userAgent: userAgent || "unknown" });

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await refreshTokenModel.create({
    token: hashedToken,
    user: user._id,
    userAgent: userAgent || "unknown",
    ip: ip || "unknown",
    expiresAt,
  });

  return rawToken;
};
