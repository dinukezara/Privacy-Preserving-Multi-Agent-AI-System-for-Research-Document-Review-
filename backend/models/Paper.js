const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    abstract: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "accepted", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paper", paperSchema);