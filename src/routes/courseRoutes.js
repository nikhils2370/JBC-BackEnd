const express = require("express");
const Course = require("../models/Course");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses (popular first)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/courses
// @desc    Admin: add new course
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, shortName, duration, description, features, isPopular, order } = req.body;

    if (!title || !shortName || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, shortName, and description",
      });
    }

    const course = await Course.create({
      title,
      shortName,
      duration: duration || "3 Months",
      description,
      features: Array.isArray(features)
        ? features
        : typeof features === "string"
        ? features.split(",").map((f) => f.trim())
        : [],
      isPopular: isPopular !== undefined ? isPopular : true,
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: "Course added successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Admin: update course
// @access  Private/Admin
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (typeof updateData.features === "string") {
      updateData.features = updateData.features.split(",").map((f) => f.trim());
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Admin: delete course
// @access  Private/Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({
      success: true,
      message: "Course removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
