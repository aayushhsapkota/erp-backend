import { verifyAccessToken } from "../Utils/token.js";

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Login to continue." });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decodedData = verifyAccessToken(token);
    //injects this attributes in request after decoding token
    req.userId = decodedData?.id;
    req.isAdmin = decodedData?.isAdmin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please login to continue." });
  }
};

const checkAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Unauthorized Admin" });
  }
  next();
};


export { auth, checkAdmin };
