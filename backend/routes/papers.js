const express = require("express");
const mongoose = require("mongoose");
const Paper = require("../models/Paper");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Reject malformed ids before they reach the database
function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  next();
}

function pickPaperFields(body) {
  const { title, authors, abstract, status } = body;
  const data = { title, authors, abstract, status };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
}

// CREATE
router.post("/", requireAuth, async (req, res) => {
  try {
    const paper = await Paper.create({ ...req.body, owner: req.user._id });
    res.status(201).json(paper);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all (newest first)
router.get("/", requireAuth, async (req, res) => {
  try {
    const papers = await Paper.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one
router.get("/:id", requireAuth, checkId, async (req, res) => {
  try {
    const paper = await Paper.findOne({ _id: req.params.id, owner: req.user._id });
    if (!paper) return res.status(404).json({ error: "Paper not found" });
    res.json(paper);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/:id", requireAuth, checkId, async (req, res) => {
  try {
    const paper = await Paper.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!paper) return res.status(404).json({ error: "Paper not found" });
    res.json(paper);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", requireAuth, checkId, async (req, res) => {
  try {
    const paper = await Paper.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!paper) return res.status(404).json({ error: "Paper not found" });
    res.json({ message: "Paper deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;