const mongoose = require("mongoose");

const heroSlideSchema = new mongoose.Schema(
  {
    small: {
      type: String,
      default: "WELCOME TO JBC",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    highlight: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      required: true,
      default: "/hero-1.jpg",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HeroSlide", heroSlideSchema);
