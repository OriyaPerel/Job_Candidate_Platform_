import User from "../models/UserModel.js";

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

    // ולידציות ברורות + הודעות טובות
    if (!fullName || !role || !email || !password) {
      return res.status(400).json({ message: "fullName, role, email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // דופליקייט מייל? החזר 409 במקום 500
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // נרמל קלטים
    const normalizedSkills = Array.isArray(skills)
      ? skills
      : String(skills || "").split(",").map(s => s.trim()).filter(Boolean);

    const normalizedJobsLookingFor = Array.isArray(jobsLookingFor)
      ? jobsLookingFor
      : String(jobsLookingFor || "").split(",").map(s => s.trim()).filter(Boolean);

    const years = Number.isFinite(Number(yearsExperience)) ? Number(yearsExperience) : 0;

    // hash לסיסמה
    const passwordHash = await bcrypt.hash(password, 10);

    // יצירה
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
    });

    return res.status(201).json({
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    // החזרי שגיאת ולידציה יפה במקום 500
    if (err?.name === 'ValidationError') {
      // לדוגמה: role/fulName חסר וכד'
      const fields = Object.keys(err.errors);
      return res.status(400).json({ message: `Validation failed: ${fields.join(', ')}` });
    }
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    console.error('REGISTER error:', err);
    return res.status(500).json({ message: 'Server error', detail: err?.message });
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

