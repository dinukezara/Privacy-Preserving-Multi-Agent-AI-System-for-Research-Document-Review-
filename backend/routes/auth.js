const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    institution: user.institution,
    role: user.role,
    website: user.website,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

function issueToken(user) {
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET || "development-secret", { expiresIn: "30d" });
}

router.post("/signup", async (req, res) => {
  const { name, email, institution, password } = req.body;
  if (!name || !email || !institution || !password) {
    return res.status(400).json({ error: "name, email, institution, and password are required" });
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: "Password must contain 8 characters, one uppercase letter, and one number" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, institution, passwordHash });
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "An account with this email already exists" });
    res.status(400).json({ error: error.message });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({ token: issueToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

router.put("/me", requireAuth, async (req, res) => {
  const { name, institution, role, website, bio } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, institution, role, website, bio },
      { new: true, runValidators: true }
    );
    res.json(publicUser(user));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
