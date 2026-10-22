const express = require("express");
const mongoose = require("mongoose");
const QuizResult = require("../models/QuizResult");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/results/my-results
// @desc    Get currently logged in student's quiz history and performance stats
// @access  Private (Student & Admin)
router.get("/my-results", protect, async (req, res) => {
  try {
    const results = await QuizResult.find({ student: req.user._id }).sort({
      createdAt: -1,
    });

    const totalQuizzesPlayed = results.length;
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const totalQuestions = results.reduce(
      (acc, curr) => acc + curr.totalQuestions,
      0
    );
    const overallPercentage =
      totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const quizzesPassed = results.filter((r) => r.passed).length;
    const highestScore = results.reduce(
      (max, curr) => (curr.score > max ? curr.score : max),
      0
    );

    res.json({
      success: true,
      stats: {
        totalQuizzesPlayed,
        totalScore,
        totalQuestions,
        overallPercentage,
        quizzesPassed,
        highestScore,
      },
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/results/all
// @desc    Admin: get all quiz submissions across all students
// @access  Private/Admin
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const results = await QuizResult.find()
      .populate("student", "name email studentId")
      .populate("quiz", "title chapterName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/results/:id
// @desc    Admin: delete a single quiz result (to save DB space)
// @access  Private/Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const result = await QuizResult.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Quiz result not found",
      });
    }

    res.json({
      success: true,
      message: "Quiz result deleted successfully",
      deletedId: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/results/bulk-delete
// @desc    Admin: bulk delete selected quiz results
// @access  Private/Admin
router.post("/bulk-delete", protect, adminOnly, async (req, res) => {
  try {
    const { resultIds } = req.body;
    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of resultIds to delete",
      });
    }

    const deleteRes = await QuizResult.deleteMany({
      _id: { $in: resultIds },
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deleteRes.deletedCount} quiz results`,
      deletedCount: deleteRes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/results/clear-all
// @desc    Admin: delete all quiz results to free space
// @access  Private/Admin
router.delete("/clear-all/confirm", protect, adminOnly, async (req, res) => {
  try {
    const deleteRes = await QuizResult.deleteMany({});
    res.json({
      success: true,
      message: `Cleared all ${deleteRes.deletedCount} quiz results from database`,
      deletedCount: deleteRes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/results/export
// @desc    Admin: export quiz results as JSON or CSV
// @access  Private/Admin
router.get("/export", protect, adminOnly, async (req, res) => {
  try {
    const format = req.query.format || "json";
    const results = await QuizResult.find()
      .populate("student", "name email studentId")
      .populate("quiz", "title chapterName")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      const headers = [
        "Result ID",
        "Student Name",
        "Student ID",
        "Student Email",
        "Quiz Title",
        "Chapter",
        "Score",
        "Total Questions",
        "Percentage",
        "Passed",
        "Completed At",
      ];

      const csvRows = [headers.join(",")];

      results.forEach((r) => {
        const row = [
          `"${r._id}"`,
          `"${(r.studentName || "").replace(/"/g, '""')}"`,
          `"${(r.studentId || "").replace(/"/g, '""')}"`,
          `"${(r.studentEmail || "").replace(/"/g, '""')}"`,
          `"${(r.quizTitle || "").replace(/"/g, '""')}"`,
          `"${(r.chapterName || "").replace(/"/g, '""')}"`,
          r.score,
          r.totalQuestions,
          `${r.percentage}%`,
          r.passed ? "PASSED" : "FAILED",
          `"${new Date(r.createdAt).toISOString()}"`,
        ];
        csvRows.push(row.join(","));
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="JBC_Quiz_Results_${Date.now()}.csv"`
      );
      return res.send(csvRows.join("\n"));
    }

    // Default JSON download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="JBC_Quiz_Results_${Date.now()}.json"`
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/results/leaderboard
// @desc    Get top scorers across all students and all quizzes (Top 3 highlighted)
// @access  Public
router.get("/leaderboard", async (req, res) => {
  try {
    // Aggregate results by student
    const leaderboard = await QuizResult.aggregate([
      {
        $group: {
          _id: "$student",
          studentName: { $first: "$studentName" },
          studentEmail: { $first: "$studentEmail" },
          studentId: { $first: "$studentId" },
          totalScore: { $sum: "$score" },
          totalQuestions: { $sum: "$totalQuestions" },
          quizzesPlayed: { $sum: 1 },
          avgPercentage: { $avg: "$percentage" },
          highestScore: { $max: "$score" },
          lastQuizDate: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 1,
          studentName: 1,
          studentEmail: 1,
          studentId: 1,
          totalScore: 1,
          totalQuestions: 1,
          quizzesPlayed: 1,
          avgPercentage: { $round: ["$avgPercentage", 1] },
          highestScore: 1,
          lastQuizDate: 1,
        },
      },
      {
        $sort: { totalScore: -1, avgPercentage: -1 },
      },
    ]);

    // Format rankings and get top 3
    const rankedList = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    const top3 = rankedList.slice(0, 3);

    res.json({
      success: true,
      top3,
      leaderboard: rankedList,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
