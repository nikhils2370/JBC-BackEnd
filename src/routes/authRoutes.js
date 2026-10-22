const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "jbc_super_secure_jwt_secret_token_key_2026_education",
    { expiresIn: "30d" }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A student or user with this email already exists",
      });
    }

    // Generate unique student ID (e.g. JBC-8492)
    const count = await User.countDocuments({ role: "student" });
    const studentId = `JBC-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      studentId,
      password,
      phone: phone || "",
      role: "student",
      quizAccessApproved: false, // Explicitly false until admin approves
      quizAccessStatus: "pending",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Your quiz access request has been submitted to Admin for approval.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        quizAccessApproved: user.quizAccessApproved,
        quizAccessStatus: user.quizAccessStatus,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user (email or studentId) & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { loginIdentifier, email, password } = req.body;
    const identifier = (loginIdentifier || email || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your Email or Student ID, and Password",
      });
    }

    // Find by either email or studentId (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { studentId: identifier.toUpperCase() },
        { studentId: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. User not found with given Email/Student ID.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password. Please check and try again.",
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone,
        role: user.role,
        quizAccessApproved: user.quizAccessApproved,
        quizAccessStatus: user.quizAccessStatus,
        approvedAt: user.approvedAt,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently logged in user info & quiz status
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
