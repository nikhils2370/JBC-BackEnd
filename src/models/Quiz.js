const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr && arr.length >= 2,
      message: "Each question must have at least 2 options",
    },
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  explanation: {
    type: String,
    default: "",
    trim: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
    },
    chapterName: {
      type: String,
      required: [true, "Chapter name or title is required"],
      trim: true,
      default: "General",
    },
    category: {
      type: String,
      default: "Computer Basics",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 15,
    },
    passingPercentage: {
      type: Number,
      default: 40,
    },
    questions: [questionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);
