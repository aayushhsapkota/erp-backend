import bcrypt from "bcryptjs";

import userModel from "../models/userModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from "../utils/token.js";

const REFRESH_COOKIE_NAME = "erp-refresh-token";

// Converts the Mongoose user document into a plain object,
// removes sensitive fields such as the password and refresh tokens,
// and returns the remaining user data as a safe object to send to the client.
const toSafeUser = (user) => {
  // ...safeUser collects all remaining properties into a new object called safeUser.
// safeUser does not need to be declared separately because destructuring creates it.
  const { password, refreshTokens, ...safeUser } = user.toObject();
  return safeUser;
};

// Scoped to /API/users so it's only ever sent back on auth endpoints
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", //In production, the cookie is only sent over HTTPS.
  //"none" in prod since frontend/backend are cross-site; "lax" in dev so it still works over plain http.
  // Use "lax" in development because localhost uses HTTP and "none" requires Secure.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
  path: "/API/users",
});

// Issues a fresh access+refresh pair for `user`, persists the new refresh
// token's hash on the user document (pruning any expired ones), and sets
// the refresh cookie on `res`. Returns the access token to send in the body.
const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  //This code removes expired refresh tokens from the user's refreshTokens array.
  user.refreshTokens = (user.refreshTokens || []).filter(
    (rt) => rt.expiresAt > new Date()
  );
  user.refreshTokens.push({ tokenHash, expiresAt });
  await user.save();

  // Send the refresh token as an httpOnly cookie; the browser stores it
// automatically and sends it with eligible requests.
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...refreshCookieOptions(),
    expires: expiresAt,
  });

  return accessToken;
};

export const signin = async (req, res) => {

  const { userName, password } = req.body;

  try {
    if (!userName) {
      return res.status(400).json({ message: "Please enter username." });
    }

    if (!password) {
      return res.status(400).json({ message: "Please enter password." });
    }

    const existingUser = await userModel.findOne({ userName: userName.toLowerCase() });

    if (!existingUser)
      return res.status(404).json({ message: "Invalid Credentials!!" });


    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid Credentials!!" });

    const accessToken = await issueTokens(res, existingUser);

    //no need to send refresh token in response body, it is sent as httpOnly cookie becasue it is confifured like that in the issueTokens function.
    res.status(200).json({ token: accessToken });
  } catch (err) {
    console.error("signin failed:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const signup = async (req, res) => {
  //this is done by admin.
  const { userName, password, confirmPassword, firstName, lastName } = req.body;

  try {
    if (!userName) {
        return res.status(400).json({ message: "Please enter username." });
      }

      if (!password) {
        return res.status(400).json({ message: "Please enter password." });
      }

      if (!confirmPassword) {
        return res.status(400).json({ message: "Please confirm your password." });
      }
      if (!firstName ) {
        return res.status(400).json({ message: "Please enter your first name." });
      }
      if (!lastName ) {
        return res.status(400).json({ message: "Please enter your last name." });
      }

    const existingUser = await userModel.findOne({ userName });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords don't match" });

    const hashedPassword = await bcrypt.hash(password, 12);

    //creating userModel with hashed password using bcrypt
    const result = await userModel.create({
      userName,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
    });
  //generating and sending back tokens
    const accessToken = await issueTokens(res, result);

    res.status(201).json({ result: toSafeUser(result), token: accessToken });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });

    console.log(error);
  }
};

// Exchanges the httpOnly refresh cookie for a new access token, rotating the
// refresh token in the same call. Called silently by the frontend on page load/reload or
// when the access token expires.

//returns access token in the response body and also a new refresh token in the httpOnly cookie. The old refresh token is removed from the user document.
export const refresh = async (req, res) => {
  try {
    //Get the refresh token from the cookie
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return res.status(401).json({ message: "Please login to continue." });
    }

    const tokenHash = hashToken(refreshToken);
    const user = await userModel.findOne({ "refreshTokens.tokenHash": tokenHash });

    //If no user is found → the token is invalid/revoked → clear the cookie and require login.
    if (!user) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      return res.status(401).json({ message: "Please login to continue." });
    }

    const storedToken = user.refreshTokens.find((rt) => rt.tokenHash === tokenHash);
    if (!storedToken || storedToken.expiresAt < new Date()) {
      // If Expired token presented: drop it and
      // force a real login rather than silently extending the session.
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.tokenHash !== tokenHash);
      await user.save();
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      return res.status(401).json({ message: "Session expired, please login again." });
    }

   // Rotate: Remove the old refresh token and issue a new access + refresh token pair.
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.tokenHash !== tokenHash);
    const accessToken = await issueTokens(res, user);

    res.status(200).json({ token: accessToken });
  } catch (error) {
    console.error("refresh failed:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Deletes the refresh token from user account and clears the cookie from the browser session (this device only -
// other logged-in devices are unaffected)
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      //$pull removes the matching token from the refreshTokens array.
      await userModel.updateOne(
        { "refreshTokens.tokenHash": tokenHash },
        { $pull: { refreshTokens: { tokenHash } } }
      );
    }
    //this sends a response instructing the browser to remove the refresh token cookie
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error("logout failed:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
