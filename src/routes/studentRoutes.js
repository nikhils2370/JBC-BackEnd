const express = require("express");
const User = require("../models/User");
const QuizResult = require("../models/QuizResult");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/students
// @desc    Admin: get all students with their quiz stats & approval status
// @access  Private/Admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    // Enhance students with quiz counts & average score
    const studentIds = students.map((s) => s._id);
    const results = await QuizResult.find({ student: { $in: studentIds } });

    const enrichedStudents = students.map((student) => {
      const studentResults = results.filter(
        (r) => r.student.toString() === student._id.toString()
      );
      const totalQuizzes = studentResults.length;
      const totalScore = studentResults.reduce((acc, curr) => acc + curr.score, 0);
      const avgPercentage =
        totalQuizzes > 0
          ? Math.round(
              studentResults.reduce((acc, curr) => acc + curr.percentage, 0) /
                totalQuizzes
            )
          : 0;

      return {
        ...student.toObject(),
        quizzesPlayed: totalQuizzes,
        totalScore,
        avgPercentage,
      };
    });

    res.json({
      success: true,
      count: enrichedStudents.length,
      data: enrichedStudents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/students/:id/approval
// @desc    Admin: Approve or Revoke quiz access for a student
// @access  Private/Admin
router.patch("/:id/approval", protect, adminOnly, async (req, res) => {
  try {
    const { approved, status } = req.body;
    // status can be 'approved', 'rejected', or 'pending'
    const newApproved = approved !== undefined ? Boolean(approved) : status === "approved";
    const newStatus = status || (newApproved ? "approved" : "rejected");

    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    student.quizAccessApproved = newApproved;
    student.quizAccessStatus = newStatus;
    student.approvedAt = newApproved ? new Date() : null;

    await student.save();

    res.json({
      success: true,
      message: newApproved
        ? `Quiz access approved for ${student.name} (${student.studentId || student.email})`
        : `Quiz access revoked/rejected for ${student.name}`,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        quizAccessApproved: student.quizAccessApproved,
        quizAccessStatus: student.quizAccessStatus,
        approvedAt: student.approvedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Admin: remove student and purge all their quiz data (Course Completed)
// @access  Private/Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Also delete their quiz results
    const deleteRes = await QuizResult.deleteMany({ student: req.params.id });

    res.json({
      success: true,
      message: `Course Completed: Student ${student.name} (${student.studentId}) and ${deleteRes.deletedCount} quiz records completely removed from database.`,
      deletedStudentId: req.params.id,
      purgedResultsCount: deleteRes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/students/bulk-delete
// @desc    Admin: Select multiple students (course completed) and purge all their data from DB
// @access  Private/Admin
router.post("/bulk-delete", protect, adminOnly, async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one student to delete",
      });
    }

    // 1. Delete all selected students from User collection
    const studentDeleteRes = await User.deleteMany({
      _id: { $in: studentIds },
      role: "student",
    });

    // 2. Delete all their quiz results from QuizResult collection
    const resultsDeleteRes = await QuizResult.deleteMany({
      student: { $in: studentIds },
    });

    res.json({
      success: true,
      message: `Course Completed: Purged ${studentDeleteRes.deletedCount} student(s) and ${resultsDeleteRes.deletedCount} quiz submission(s) from database.`,
      deletedStudentsCount: studentDeleteRes.deletedCount,
      deletedResultsCount: resultsDeleteRes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
