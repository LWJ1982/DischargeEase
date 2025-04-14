const { verify } = require("jsonwebtoken");
require("dotenv").config();

const validateToken = (req, res, next) => {

  const accessToken = req.header("Authorization").split(" ")[1];
  if (!accessToken) {
    return res.status(401).json({ message: "No access, No token detected" });
  }

  try {
    const payload = verify(accessToken, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { validateToken };
