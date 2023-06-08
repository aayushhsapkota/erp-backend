import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(440).json({ message: "Unknown Request" });
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedData;
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedData?._id;
    next();
  } catch (error) {
    res.status(440).json({ message: "Login to continue" });
  }
};

const checkAdmin = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(440).json({ message: "Unknown Header" });
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedData;
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedData?.role === true) {
      req.userId = decodedData?._id;
      next();
    } else {
      res.status(440).json({ message: "Unauthorized Admin" });
    }
  } catch (error) {
    res.status(440).json({ message: error.message });
  }
};

const access = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(440).json({ message: "Unknown Header" });
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedData;
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedData.data === "dilip") {
      next();
    }
  } catch (error) {
    res.status(440).json({ message: error.message });
  }
};

export { auth, checkAdmin, access };
// {
//   '$or': [
//     { 'partyDetails.clientType': /9/i },
//     { 'productDetails.productName': /9/i },
//     { billNumber: /9/i }
//   ],
//   createdDate: { '$lte': 2080-01-27T00:00:00.000Z }
// }

// {
//   '$or': [
//     { transactionType: /9/i },
//     { amount: /9/i },
//     { note: /9/i },
//     { billNumber: /9/i }
//   ],
//   'partyDetails._id': '64457fe15312a0ed0dde4e60',
//   createdDate: {
//     '$gte': 2080-01-01T00:00:00.000Z,
//     '$lte': 2080-01-26T00:00:00.000Z
//   }
// }
