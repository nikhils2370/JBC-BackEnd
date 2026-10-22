const express = require("express");
const HeroSlide = require("../models/HeroSlide");
const { protect, adminOnly } = require("../middleware/auth");
const { upload, uploadToCloudinary } = require("../config/cloudinary");

const router = express.Router();

// @route   POST /api/hero/upload
// @desc    Admin: Upload hero image to Cloudinary (using multer)
// @access  Private/Admin
router.post(
  "/upload",
  protect,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image file",
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      res.json({
        success: true,
        message: "Hero image uploaded successfully",
        imageUrl: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error) {
      console.error("Hero upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload image",
      });
    }
  }
);

// @route   GET /api/hero
// @desc    Get all hero slides for website
// @access  Public
router.get("/", async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      count: slides.length,
      data: slides,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/hero/all (including inactive)
// @desc    Admin: get all slides
// @access  Private/Admin
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1 });
    res.json({
      success: true,
      count: slides.length,
      data: slides,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/hero
// @desc    Admin: add new hero slide
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { small, title, highlight, description, image, order } = req.body;

    const slide = await HeroSlide.create({
      small: small || "WELCOME TO JBC",
      title,
      highlight: highlight || "",
      description: description || "",
      image: image || "/hero-1.jpg",
      order: order || 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Hero slide added successfully",
      data: slide,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/hero/:id
// @desc    Admin: update hero slide
// @access  Private/Admin
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!slide) {
      return res.status(404).json({ success: false, message: "Slide not found" });
    }

    res.json({
      success: true,
      message: "Hero slide updated successfully",
      data: slide,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/hero/:id
// @desc    Admin: delete hero slide
// @access  Private/Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: "Slide not found" });
    }

    res.json({
      success: true,
      message: "Hero slide deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
