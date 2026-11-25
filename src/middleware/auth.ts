import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "#/util/variable";
import { errorHandle, ErrorType } from "#/util/errorHandling";
import User from "#/model/user";

export interface TokenPayload {
  userId: string;
  firebaseUid: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req.headers["token"] as string) || req.body?.token;

    if (!token) {
      const { message, status } = errorHandle(ErrorType.Unauthorized, "User");
      return res.status(status).json({ message });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Check if token has been revoked / logged out
    const foundUser = await User.findById(decoded.userId);
    if (!foundUser || !foundUser.token?.includes(token)) {
      return res.status(401).json({ message: "Session expired or logged out. Please log in again." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
