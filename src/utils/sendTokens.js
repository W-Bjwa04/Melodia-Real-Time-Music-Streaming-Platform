import { generateAccessToken, generateRefreshToken } from "./generateTokens.js";
import ApiResponse from "./ApiResponse.js";

const sendTokens = async (user, res, req, message = "Success", statusCode = 200) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(
    user,
    req.ip,
    req.headers["user-agent"]
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });

  const userData = {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    notificationsEnabled: user.notificationsEnabled,
  };

  return ApiResponse.success(
    res,
    message,
    { user: userData, accessToken },
    statusCode
  );
};

export default sendTokens;
