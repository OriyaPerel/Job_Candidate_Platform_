import User from "../models/UserModel.js";
// למעלה בקובץ (יחד עם שאר ה-importים)
import { embedText } from "../AI/vectorSearch.js"; // אם הקובץ בתיקייה אחרת, תעדכני את הנתיב


import bcrypt from 'bcryptjs';


export const createUser = async (req, res) => {
  try {
    const {
      fullName,
      role,
      email,
      phone,
      password,
      skills = [],
      yearsExperience = 0,
      about,
      jobsLookingFor = [],
    } = req.body || {};

    if (!fullName || !role || !email || !password) {
      return res
        .status(400)
        .json({ message: "fullName, role, email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills
      : String(skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const normalizedJobsLookingFor = Array.isArray(jobsLookingFor)
      ? jobsLookingFor
      : String(jobsLookingFor || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const years = Number.isFinite(Number(yearsExperience)) ? Number(yearsExperience) : 0;

    const passwordHash = await bcrypt.hash(password, 10);

    // 🔹 חישוב טקסט לאמבדינג
    const embeddingText = [
      fullName,
      role,
      normalizedSkills.join(", "),
      `years of experience: ${years}`,
      normalizedJobsLookingFor.length
        ? `looking for: ${normalizedJobsLookingFor.join(", ")}`
        : "",
      about || "",
    ]
      .filter(Boolean)
      .join(" | ");

    let embedding = [];
    try {
      embedding = await embedText(embeddingText);
    } catch (e) {
      console.error("Failed to embed new user:", e);
    }

    const user = await User.create({
      fullName: fullName.trim(),
      role: role.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      skills: normalizedSkills,
      yearsExperience: years,
      about,
      jobsLookingFor: normalizedJobsLookingFor,
      passwordHash,
      embedding, // ⬅️ חשוב בשביל vector search
    });

    return res.status(201).json({
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    if (err?.name === "ValidationError") {
      const fields = Object.keys(err.errors);
      return res
        .status(400)
        .json({ message: `Validation failed: ${fields.join(", ")}` });
    }
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.error("REGISTER error:", err);
    return res
      .status(500)
      .json({ message: "Server error", detail: err?.message });
  }
};

export const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email }).select(
      "fullName role email phone skills yearsExperience about createdAt updatedAt jobsLookingFor"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

