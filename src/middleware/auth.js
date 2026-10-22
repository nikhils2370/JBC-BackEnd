const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - JWT verification
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "jbc_super_secure_jwt_secret_token_key_2026_education"
      );

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found with this token",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("JWT Auth error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid or expired token",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access forbidden: Admin privilege required",
  });
};

// Quiz Access Approval Check
// "user login karna ka bad sida quiz ko acsase nahi kar skata jab tak admin usa quiz accsase ka liya admin page sa apruval nahi da data"
const requireQuizApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Please login to access quizzes",
    });
  }

  // Admins always have access
  if (req.user.role === "admin") {
    return next();
  }

  // Check if student's quiz access has been approved by admin
  if (!req.user.quizAccessApproved) {
    return res.status(403).json({
      success: false,
      accessApproved: false,
      status: req.user.quizAccessStatus || "pending",
      message:
        "Aapka Quiz Access abhi Admin dwara approve nahi hua hai. Quiz khelne ke liye Admin Approval zaroori hai.",
    });
  }

  next();
};

module.exports = { protect, adminOnly, requireQuizApproval };
