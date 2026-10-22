const User = require("../models/User");
const HeroSlide = require("../models/HeroSlide");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");

const seedDatabase = async () => {
  try {
    // 1. Seed Admin
    const adminExists = await User.findOne({ role: "admin" });
    let adminUser;
    if (!adminExists) {
      adminUser = await User.create({
        name: "JBC Administrator",
        email: "admin@jbc.com",
        studentId: "ADMIN-001",
        password: "AdminPassword123!",
        role: "admin",
        quizAccessApproved: true,
        quizAccessStatus: "approved",
      });
      console.log(" Default Admin created: admin@jbc.com / AdminPassword123!");
    } else {
      adminUser = adminExists;
    }

    // 2. Seed Hero Slides
    const heroCount = await HeroSlide.countDocuments();
    if (heroCount === 0) {
      await HeroSlide.create([
        {
          image: "/hero-1.jpg",
          small: "WELCOME TO JBC",
          title: "Learn Today.",
          highlight: "Lead Tomorrow.",
          description:
            "Build practical computer skills with industry-focused courses and expert guidance.",
          order: 1,
          isActive: true,
        },
        {
          image: "/hero-2.jpg",
          small: "SMART COMPUTER EDUCATION",
          title: "Upgrade Your",
          highlight: "Digital Skills.",
          description:
            "From basic computing to advanced technology, learn skills that matter.",
          order: 2,
          isActive: true,
        },
        {
          image: "/hero-3.jpg",
          small: "CAREER FOCUSED LEARNING",
          title: "Your Success",
          highlight: "Starts Here.",
          description:
            "Join JBC and take your first step toward a brighter digital career.",
          order: 3,
          isActive: true,
        },
      ]);
      console.log(" Default Hero slides seeded");
    }

    // 3. Seed Courses
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      await Course.create([
        {
          title: "RKCL",
          shortName: "RKCL",
          duration: "3–6 Months",
          description:
            "Build essential digital literacy and computer skills for education, employment and everyday digital work.",
          features: [
            "Computer fundamentals",
            "Internet & digital services",
            "Practical computer training",
          ],
          isPopular: true,
          order: 1,
        },
        {
          title: "RS-CIT",
          shortName: "RS-CIT",
          duration: "3 Months",
          description:
            "Learn practical information technology skills through a structured and student-friendly curriculum.",
          features: [
            "Computer basics",
            "Office applications",
            "Internet & online services",
          ],
          isPopular: true,
          order: 2,
        },
        {
          title: "Tally Prime",
          shortName: "TALLY",
          duration: "2–4 Months",
          description:
            "Learn accounting concepts and Tally Prime with practical exercises for real-world business use.",
          features: [
            "Accounting fundamentals",
            "Tally Prime",
            "GST & business reports",
          ],
          isPopular: true,
          order: 3,
        },
        {
          title: "Web Development",
          shortName: "WEB DEV",
          duration: "4–6 Months",
          description:
            "Develop modern websites and learn the fundamentals of frontend development and web technologies.",
          features: [
            "HTML & CSS",
            "JavaScript fundamentals",
            "Responsive web design",
          ],
          isPopular: true,
          order: 4,
        },
      ]);
      console.log(" Default Popular Courses seeded");
    }

    // 4. Seed Quizzes with distinct Chapters / Titles
    const quizCount = await Quiz.countDocuments();
    let quiz1, quiz2, quiz3;

    if (quizCount === 0) {
      quiz1 = await Quiz.create({
        title: "Computer Fundamentals & Hardware",
        chapterName: "Chapter 1: Basics of Computers",
        category: "Chapters",
        description:
          "Test your knowledge of computer hardware, CPU, memory, and peripheral devices.",
        durationMinutes: 10,
        passingPercentage: 40,
        questions: [
          {
            question: "What does CPU stand for?",
            options: [
              "Central Processing Unit",
              "Computer Personal Unit",
              "Central Program Utility",
              "Computer Processing Utility",
            ],
            answer: "Central Processing Unit",
            explanation: "CPU is the brain of the computer that executes instructions.",
          },
          {
            question: "Which of the following is volatile memory?",
            options: ["ROM", "RAM", "Hard Disk", "Flash Drive"],
            answer: "RAM",
            explanation: "RAM loses its contents when power is turned off.",
          },
          {
            question: "Which device is primarily used for outputting text/graphics on paper?",
            options: ["Scanner", "Printer", "Monitor", "Keyboard"],
            answer: "Printer",
            explanation: "A printer provides hard-copy output.",
          },
          {
            question: "1 Gigabyte (GB) is equal to how many Megabytes (MB)?",
            options: ["1000 MB", "1024 MB", "512 MB", "2048 MB"],
            answer: "1024 MB",
            explanation: "1 GB = 1024 Megabytes in binary architecture.",
          },
          {
            question: "Which shortcut key is used to copy selected items in Windows?",
            options: ["Ctrl + C", "Ctrl + V", "Ctrl + X", "Ctrl + Z"],
            answer: "Ctrl + C",
            explanation: "Ctrl + C copies the selected item to clipboard.",
          },
        ],
      });

      quiz2 = await Quiz.create({
        title: "Internet & Web Technologies",
        chapterName: "Chapter 2: Web & Digital World",
        category: "Chapters",
        description:
          "Assess your understanding of web pages, browsers, HTML, and network basics.",
        durationMinutes: 10,
        passingPercentage: 40,
        questions: [
          {
            question: "Which language is primarily used to structure a webpage?",
            options: ["CSS", "HTML", "JavaScript", "Python"],
            answer: "HTML",
            explanation: "HTML stands for HyperText Markup Language, the backbone of websites.",
          },
          {
            question: "Which one is a web browser?",
            options: ["MS Excel", "Google Chrome", "PowerPoint", "Tally Prime"],
            answer: "Google Chrome",
            explanation: "Chrome is a web browser created by Google.",
          },
          {
            question: "Which technology is used for styling web pages?",
            options: ["HTML", "CSS", "SQL", "Python"],
            answer: "CSS",
            explanation: "CSS is used for designing layouts, colors, and fonts on web pages.",
          },
          {
            question: "What does URL stand for?",
            options: [
              "Uniform Resource Locator",
              "Universal Routing Language",
              "Unified Radio Link",
              "Universal Resource Logic",
            ],
            answer: "Uniform Resource Locator",
            explanation: "A URL is the global address of documents on the World Wide Web.",
          },
        ],
      });

      quiz3 = await Quiz.create({
        title: "Tally Prime & Accounting Basics",
        chapterName: "Chapter 3: Accounting & GST",
        category: "Chapters",
        description:
          "Evaluate your practical understanding of vouchers, ledgers, and digital bookkeeping.",
        durationMinutes: 10,
        passingPercentage: 40,
        questions: [
          {
            question: "Which software is commonly used for accounting & GST in India?",
            options: ["Tally Prime", "Photoshop", "Chrome", "VS Code"],
            answer: "Tally Prime",
            explanation: "Tally Prime is India's leading business accounting software.",
          },
          {
            question: "Which function key is used for Payment Voucher in Tally?",
            options: ["F4", "F5", "F6", "F8"],
            answer: "F5",
            explanation: "F5 is used to record payment transactions in Tally.",
          },
          {
            question: "Which function key is used for Receipt Voucher in Tally?",
            options: ["F5", "F6", "F7", "F9"],
            answer: "F6",
            explanation: "F6 opens the Receipt voucher in Tally.",
          },
        ],
      });

      // Seed Assignment Quizzes
      const assignment1 = await Quiz.create({
        title: "MS Office & Word Processing Practical Assignment",
        chapterName: "Assignment 1: MS Word & Office",
        category: "Assignments",
        description:
          "Hands-on assignment test on document formatting, mail merge, and keyboard shortcuts.",
        durationMinutes: 12,
        passingPercentage: 40,
        questions: [
          {
            question: "What is the shortcut key to center align text in MS Word?",
            options: ["Ctrl + E", "Ctrl + C", "Ctrl + J", "Ctrl + R"],
            answer: "Ctrl + E",
            explanation: "Ctrl + E is used for center alignment in Microsoft Word.",
          },
          {
            question: "Which feature in MS Word is used to send customized letters to multiple recipients?",
            options: ["Mail Merge", "Macro", "Watermark", "Header & Footer"],
            answer: "Mail Merge",
            explanation: "Mail Merge enables batch generation of personalized letters or envelopes.",
          },
          {
            question: "What is the default file extension for documents saved in MS Word 2016 and above?",
            options: [".docx", ".doc", ".txt", ".rtf"],
            answer: ".docx",
            explanation: ".docx is the default XML-based document format for Microsoft Word.",
          },
        ],
      });

      const assignment2 = await Quiz.create({
        title: "Tally GST & Ledger Assignment",
        chapterName: "Assignment 2: GST Invoicing",
        category: "Assignments",
        description:
          "Practical scenario test on CGST, SGST, IGST calculations and journal entries.",
        durationMinutes: 15,
        passingPercentage: 40,
        questions: [
          {
            question: "Which tax is applicable on intra-state (within same state) supply of goods?",
            options: ["CGST + SGST", "IGST only", "UTGST only", "Custom Duty"],
            answer: "CGST + SGST",
            explanation: "Intra-state sales attract both Central GST and State GST.",
          },
          {
            question: "Which functional key is used to select Sales voucher in Tally Prime?",
            options: ["F8", "F9", "F4", "F7"],
            answer: "F8",
            explanation: "F8 opens the Sales Voucher in Tally Prime.",
          },
        ],
      });

      console.log(" Default Quizzes seeded with Chapters and Assignments");
    } else {
      // Ensure existing quizzes have category or add an Assignment quiz if missing
      const assignmentExists = await Quiz.findOne({ category: "Assignments" });
      if (!assignmentExists) {
        await Quiz.create({
          title: "MS Office & Word Processing Practical Assignment",
          chapterName: "Assignment 1: MS Word & Office",
          category: "Assignments",
          description: "Hands-on assignment test on document formatting, mail merge, and keyboard shortcuts.",
          durationMinutes: 12,
          passingPercentage: 40,
          questions: [
            {
              question: "What is the shortcut key to center align text in MS Word?",
              options: ["Ctrl + E", "Ctrl + C", "Ctrl + J", "Ctrl + R"],
              answer: "Ctrl + E",
              explanation: "Ctrl + E is used for center alignment in Microsoft Word.",
            },
            {
              question: "Which feature in MS Word is used to send customized letters to multiple recipients?",
              options: ["Mail Merge", "Macro", "Watermark", "Header & Footer"],
              answer: "Mail Merge",
              explanation: "Mail Merge enables batch generation of personalized letters or envelopes.",
            },
          ],
        });
        console.log(" Added Assignment quiz to existing database");
      }
    }

    // 5. Seed Initial Students & Leaderboard Results if needed
    const studentCount = await User.countDocuments({ role: "student" });
    if (studentCount === 0) {
      const student1 = await User.create({
        name: "Rahul Sharma",
        email: "rahul@gmail.com",
        studentId: "JBC-2026-001",
        phone: "9876543210",
        password: "Student123!",
        role: "student",
        quizAccessApproved: true,
        quizAccessStatus: "approved",
        approvedAt: new Date(),
      });

      const student2 = await User.create({
        name: "Priya Verma",
        email: "priya@gmail.com",
        studentId: "JBC-2026-002",
        phone: "9876543211",
        password: "Student123!",
        role: "student",
        quizAccessApproved: true,
        quizAccessStatus: "approved",
        approvedAt: new Date(),
      });

      const student3 = await User.create({
        name: "Amit Kumar",
        email: "amit@gmail.com",
        studentId: "JBC-2026-003",
        phone: "9876543212",
        password: "Student123!",
        role: "student",
        quizAccessApproved: true,
        quizAccessStatus: "approved",
        approvedAt: new Date(),
      });

      // A pending student so admin can immediately test the approval workflow!
      await User.create({
        name: "Neha Singh (Pending)",
        email: "neha@gmail.com",
        studentId: "JBC-2026-004",
        phone: "9876543213",
        password: "Student123!",
        role: "student",
        quizAccessApproved: false,
        quizAccessStatus: "pending",
      });

      console.log(" Seed students created (including 1 pending approval)");

      // Create initial sample quiz results to populate Top 3 Scorers leaderboard
      if (quiz1 && quiz2) {
        await QuizResult.create([
          {
            student: student1._id,
            studentName: student1.name,
            studentEmail: student1.email,
            studentId: student1.studentId,
            quiz: quiz1._id,
            quizTitle: quiz1.title,
            chapterName: quiz1.chapterName,
            score: 5,
            totalQuestions: 5,
            percentage: 100,
            passed: true,
            answers: [],
          },
          {
            student: student1._id,
            studentName: student1.name,
            studentEmail: student1.email,
            studentId: student1.studentId,
            quiz: quiz2._id,
            quizTitle: quiz2.title,
            chapterName: quiz2.chapterName,
            score: 4,
            totalQuestions: 4,
            percentage: 100,
            passed: true,
            answers: [],
          },
          {
            student: student2._id,
            studentName: student2.name,
            studentEmail: student2.email,
            studentId: student2.studentId,
            quiz: quiz1._id,
            quizTitle: quiz1.title,
            chapterName: quiz1.chapterName,
            score: 4,
            totalQuestions: 5,
            percentage: 80,
            passed: true,
            answers: [],
          },
          {
            student: student2._id,
            studentName: student2.name,
            studentEmail: student2.email,
            studentId: student2.studentId,
            quiz: quiz2._id,
            quizTitle: quiz2.title,
            chapterName: quiz2.chapterName,
            score: 4,
            totalQuestions: 4,
            percentage: 100,
            passed: true,
            answers: [],
          },
          {
            student: student3._id,
            studentName: student3.name,
            studentEmail: student3.email,
            studentId: student3.studentId,
            quiz: quiz1._id,
            quizTitle: quiz1.title,
            chapterName: quiz1.chapterName,
            score: 4,
            totalQuestions: 5,
            percentage: 80,
            passed: true,
            answers: [],
          },
        ]);
        console.log(" Initial Quiz Results & Leaderboard seeded");
      }
    }
  } catch (error) {
    console.error("Seeder Error:", error.message);
  }
};

module.exports = seedDatabase;
