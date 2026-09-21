require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const paperRoutes = require("./routes/papers");
const Paper = require("./models/Paper");
const Review = require("./models/Review");
const authRoutes = require("./routes/auth");
const { requireAuth } = require("./middleware/auth");
const app = express();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { runAgentReview } = require("./services/agentReview");

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(helmet());
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.use("/api/papers", paperRoutes);
app.use("/api/auth", authRoutes);

app.post("/api/reviews", requireAuth, async (req, res) => {
  const { title, authors, abstract, full_text, tier, document_type } = req.body;
  if (!title || !full_text) {
    return res.status(400).json({ error: "title and full_text are required" });
  }

  let paper;
  try {
    paper = await Paper.create({
      title,
      authors: Array.isArray(authors) ? authors : [],
      abstract: abstract || "",
      status: "under_review",
      owner: req.user._id,
    });

    const review = await runAgentReview({
      paper_id: paper._id.toString(),
      title,
      abstract,
      full_text,
      tier,
      document_type,
    });

    const savedReview = await Review.create({
      paper: paper._id,
      owner: req.user._id,
      title,
      abstract: abstract || "",
      fullText: full_text,
      tier,
      documentType: document_type || "paper",
      result: review,
      weightedScore: review.weighted_score,
      recommendation: review.recommendation,
    });

    const nextStatus = review.recommendation === "Accept" ? "accepted" : review.recommendation === "Reject" ? "rejected" : "under_review";
    await Paper.findByIdAndUpdate(paper._id, { status: nextStatus });

    res.status(201).json({ ...review, _id: savedReview._id.toString(), title });
  } catch (err) {
    console.error("Agent review error:", err.message);
    if (paper) await Paper.findByIdAndUpdate(paper._id, { status: "submitted" }).catch(() => {});
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/reviews", requireAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ owner: req.user._id })
      .select("title tier weightedScore recommendation createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reviews/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid review id" });
  }

  try {
    const savedReview = await Review.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!savedReview) return res.status(404).json({ error: "Review not found" });
    res.json({ ...savedReview.result, _id: savedReview._id.toString(), title: savedReview.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });