import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import userModel from "../models/userModel.js";

const signatureKey = "mySecretKey";

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Please enter email." });
    }

    if (!password) {
      return res.status(400).json({ message: "Please enter password." });
    }

    const existingUser = await userModel.findOne({ email });
    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist" });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser._id,
        isAdmin: existingUser.isAdmin,
      },
      signatureKey,
      { expiresIn: "1h" }
    );

    res.status(200).json({ result: existingUser, token });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const signup = async (req, res) => {
  //this is done by admin.
  const { email, password, confirmPassword, firstName, lastName } = req.body;

  try {
    if (!email) {
        return res.status(400).json({ message: "Please enter email." });
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

    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords don't match" });

    const hashedPassword = await bcrypt.hash(password, 12);

    //creating userModel with hashed password using bcrypt
    const result = await userModel.create({
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
    });
  //generating and sending back token
    const token = jwt.sign(
      { email: result.email, id: result._id, isAdmin: result.isAdmin },
      signatureKey,
      { expiresIn: "1h" }
    );

    res.status(201).json({ result, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });

    console.log(error);
  }
};
