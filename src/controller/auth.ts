import { RequestHandler } from "express";
import { createUser } from "#/@types/auth";
import User from "#/model/user";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "#/util/variable";

export const create: RequestHandler = async (req: createUser, res) => {
  try {
    const { firebaseUid, name, email, emailVerified, photoURL } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required!" });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        firebaseUid,
        name,
        email,
        emailVerified: emailVerified ?? false,
        ...(photoURL ? { photoURL } : {}),
      });
      isNewUser = true;
    }

    // Check if client already sent an existing valid token
    const authHeader = req.headers.authorization;
    const incomingToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req.headers["token"] as string);

    let isExistingTokenValid = false;

    if (incomingToken && user.token?.includes(incomingToken)) {
      try {
        const decoded: any = jwt.verify(incomingToken, JWT_SECRET);
        if (decoded?.userId === user._id.toString()) {
          isExistingTokenValid = true;
        }
      } catch {
        isExistingTokenValid = false;
      }
    }

    // Only generate a new token if there is no valid active token from the client
    const token: string =
      isExistingTokenValid && incomingToken
        ? incomingToken
        : jwt.sign(
            {
              userId: user._id.toString(),
              firebaseUid: user.firebaseUid,
              email: user.email,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
          );

    // Filter out expired tokens (> 7 days)
    const validTokens = (user.token || []).filter((t) => {
      try {
        jwt.verify(t, JWT_SECRET);
        return true;
      } catch {
        return false;
      }
    });

    // Deduplicate and cap to at most the latest 5 active sessions
    const uniqueTokens = Array.from(new Set<string>([...validTokens, token]));
    user.token = uniqueTokens.slice(-5);
    await user.save();

    return res.status(isNewUser ? 201 : 200).json({ user, token });
  } catch (error: any) {
    console.error("Error creating/finding user:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req.headers["token"] as string) || req.body?.token;

    if (!token) {
      return res.status(400).json({ error: "Token is required to logout" });
    }

    const userId = req.user?.userId;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $pull: { token: token },
      });
    } else {
      // If called without isAuth middleware, remove matching token from DB
      await User.findOneAndUpdate(
        { token: token },
        { $pull: { token: token } }
      );
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: error.message || "Failed to logout" });
  }
};
