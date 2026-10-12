import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required:  true },
  userName: { type: String, required: true, unique:true},
  password: { type: String, required: true },
  isAdmin:{type:Boolean, default:false},
  // Hashes of active refresh tokens (never the raw token). An array, not a
  // single value, so a user can stay logged in on more than one device;
  //Remove each token record when it expires or is replaced during rotation.
  refreshTokens: [
    {
      tokenHash: { type: String, required: true },
      expiresAt: { type: Date, required: true },
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
