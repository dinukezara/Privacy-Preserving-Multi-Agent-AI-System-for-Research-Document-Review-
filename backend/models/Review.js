const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    abstract: { type: String, default: "" },
    fullText: { type: String, required: true },
    tier: { type: String, required: true },
    documentType: {
      type: String,
      enum: ["paper", "thesis", "presentation"],
      default: "paper",
    },
    status: {
      type: String,
      enum: ["complete", "failed"],
      default: "complete",
    },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    weightedScore: { type: Number, min: 0, max: 10 },
    recommendation: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
