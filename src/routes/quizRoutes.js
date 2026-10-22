const express = require("express");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const { protect, adminOnly, requireQuizApproval } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get list of available quizzes (grouped by chapter/title)
// @access  Public (overview only; actual questions require auth & approval)
router.get("/", async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const quizzes = await Quiz.find(filter)
      .select("-questions.answer -questions.explanation") // Keep safe
      .sort({ createdAt: -1 });

    const formatted = quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      chapterName: q.chapterName,
      category: q.category || "Chapters",
      description: q.description,
      durationMinutes: q.durationMinutes,
      totalQuestions: q.questions ? q.questions.length : 0,
      createdAt: q.createdAt,
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/quizzes/admin-all
// @desc    Admin: get all quizzes with full question details and answers
// @access  Private/Admin
router.get("/admin-all", protect, adminOnly, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/quizzes/admin/:id
// @desc    Admin: get full quiz for editing (includes all answers and explanations)
// @access  Private/Admin
router.get("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get single quiz to play (Requires Login & Admin Approval!)
// @access  Private (protect + requireQuizApproval)
router.get("/:id", protect, requireQuizApproval, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ success: false, message: "Quiz not found or inactive" });
    }

    // If user is student, do NOT send the correct answers to prevent cheating
    const isStudent = req.user.role === "student";
    const questions = quiz.questions.map((q) => {
      const obj = {
        _id: q._id,
        question: q.question,
        options: q.options,
      };
      if (!isStudent) {
        obj.answer = q.answer;
        obj.explanation = q.explanation;
      }
      return obj;
    });

    res.json({
      success: true,
      data: {
        _id: quiz._id,
        title: quiz.title,
        chapterName: quiz.chapterName,
        category: quiz.category,
        description: quiz.description,
        durationMinutes: quiz.durationMinutes,
        passingPercentage: quiz.passingPercentage,
        questions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit answers for a quiz (Requires Login & Admin Approval)
// @access  Private (protect + requireQuizApproval)
router.post("/:id/submit", protect, requireQuizApproval, async (req, res) => {
  try {
    const { answers, timeSpentSeconds } = req.body;
    // answers format: { "questionId": "selectedOptionString" } or array of { questionId, selected }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    let score = 0;
    const evaluatedAnswers = [];

    quiz.questions.forEach((q, index) => {
      let selectedOption = "";
      if (answers && typeof answers === "object") {
        selectedOption = answers[q._id] || answers[index] || "";
      }

      const isCorrect =
        selectedOption &&
        selectedOption.trim().toLowerCase() === q.answer.trim().toLowerCase();

      if (isCorrect) {
        score++;
      }

      evaluatedAnswers.push({
        questionText: q.question,
        selectedOption: selectedOption || "Not Answered",
        correctOption: q.answer,
        isCorrect: Boolean(isCorrect),
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.passingPercentage || 40);

    const result = await QuizResult.create({
      student: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentId: req.user.studentId || "",
      quiz: quiz._id,
      quizTitle: quiz.title,
      chapterName: quiz.chapterName,
      score,
      totalQuestions,
      percentage,
      passed,
      answers: evaluatedAnswers,
      timeSpentSeconds: timeSpentSeconds || 0,
    });

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully!",
      result: {
        _id: result._id,
        score,
        totalQuestions,
        percentage,
        passed,
        quizTitle: quiz.title,
        chapterName: quiz.chapterName,
        answers: evaluatedAnswers,
        completedAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/quizzes
// @desc    Admin: Create quiz with chapter name, title, and questions
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      title,
      chapterName,
      category,
      description,
      durationMinutes,
      passingPercentage,
      questions,
    } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a quiz title and at least one question",
      });
    }

    const quiz = await Quiz.create({
      title,
      chapterName: chapterName || "General",
      category: category || "Computer Basics",
      description: description || "",
      durationMinutes: durationMinutes || 15,
      passingPercentage: passingPercentage || 40,
      questions,
    });

    res.status(201).json({
      success: true,
      message: `Quiz "${quiz.title}" for "${quiz.chapterName}" created successfully!`,
      data: quiz,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   POST /api/quizzes/json-import
// @desc    Admin: Import questions or quizzes from JSON file / payload
// @access  Private/Admin
router.post("/json-import", protect, adminOnly, async (req, res) => {
  try {
    const { quizData, jsonString } = req.body;
    let parsedData = quizData;

    if (jsonString) {
      try {
        parsedData = JSON.parse(jsonString);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format: " + err.message,
        });
      }
    }

    if (!parsedData) {
      return res.status(400).json({
        success: false,
        message: "No quiz JSON data provided",
      });
    }

    // Support single quiz or array of quizzes
    if (Array.isArray(parsedData)) {
      const createdQuizzes = [];
      for (const item of parsedData) {
        if (item.title && Array.isArray(item.questions)) {
          const newQuiz = await Quiz.create({
            title: item.title,
            chapterName: item.chapterName || "General",
            category: item.category || "Imported",
            description: item.description || "",
            durationMinutes: item.durationMinutes || 15,
            passingPercentage: item.passingPercentage || 40,
            questions: item.questions,
          });
          createdQuizzes.push(newQuiz);
        }
      }
      return res.status(201).json({
        success: true,
        message: `Successfully imported ${createdQuizzes.length} quiz(zes) from JSON!`,
        count: createdQuizzes.length,
        data: createdQuizzes,
      });
    } else if (parsedData.title && Array.isArray(parsedData.questions)) {
      const newQuiz = await Quiz.create({
        title: parsedData.title,
        chapterName: parsedData.chapterName || "General",
        category: parsedData.category || "Imported",
        description: parsedData.description || "",
        durationMinutes: parsedData.durationMinutes || 15,
        passingPercentage: parsedData.passingPercentage || 40,
        questions: parsedData.questions,
      });
      return res.status(201).json({
        success: true,
        message: `Quiz "${newQuiz.title}" (${newQuiz.chapterName}) imported successfully with ${newQuiz.questions.length} questions!`,
        data: newQuiz,
      });
    } else {
      return res.status(400).json({
        success: false,
        message:
          "JSON must have at least { 'title': '...', 'chapterName': '...', 'questions': [...] }",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/quizzes/:id
// @desc    Admin: Update quiz details and questions
// @access  Private/Admin
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    res.json({
      success: true,
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/quizzes/:id
// @desc    Admin: Delete quiz
// @access  Private/Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    res.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
