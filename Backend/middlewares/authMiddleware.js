const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  // some code to check for user authentication
  try {
    const authToken = req.headers.authorization;
    if (!authToken) {
      return res
        .status(401)
        .json({ message: "Authentication Credentials not provided" });
    }
    if (authToken.split(" ")[0] !== "Bearer" || !authToken.split(" ")[1]) {
      return res.json("Invalid authorization header");
    }

    const token = authToken.split(" ")[1];

    jwt.verify(token, process.env.SECRET_KEY, (error, decodedToken) => {
      if (error) {
        return res.status(401).json({ message: error.message });
      }

      req.user = decodedToken.user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
};

const isActivated = (req, res, next) => {
  try {
    if (req.user.active !== true) {
      return res
        .status(403)
        .json({
          message: "Please Activate your account to perform ths action"
        });
    }
  } catch (error) {
    return res.json(error);
  }

  next();
};

module.exports = { authenticate, isActivated };
