const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    console.log(req.headers);

    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("TOKEN:", token);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("DECODED:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = protect;