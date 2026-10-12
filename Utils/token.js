import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.signatureKey;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS || 7);

if (!ACCESS_TOKEN_SECRET) {
  console.warn("Warning: signatureKey is not set - access tokens cannot be signed.");
}
if (!REFRESH_TOKEN_SECRET) {
console.warn(
  "Warning: REFRESH_TOKEN_SECRET is not set - using the access token secret to hash refresh tokens."
);}

// Access token: short-lived JWT, same claims as before.
export const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, userName: user.userName, isAdmin: user.isAdmin },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_TOKEN_SECRET);

// Refresh token: a random value that we never decode.
// We hash it and compare the hash with the one stored in the user's document.
// Since it contains no claims or information, it doesn't need to be a JWT.

export const generateRefreshToken = () => crypto.randomBytes(40).toString("hex");

export const hashToken = (token) =>
  crypto.createHmac("sha256", REFRESH_TOKEN_SECRET || ACCESS_TOKEN_SECRET)
    .update(token)
    .digest("hex");

//Gives the exact date and time when this refresh token should expire
export const getRefreshTokenExpiry = () =>
  new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
