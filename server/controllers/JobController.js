import mongoose from "mongoose";
import Job from "../models/JobModel.js";

export async function createJob(req, res) {
  try {
    const postedBy = req.user?._id; 
    if (!postedBy) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
      position,
      description,
      yearsOfExperienceRequired = 0,
      skillsRequired = [],
      department,
      location,
    } = req.body ?? {};

    if (!position || !description) {
      return res.status(400).json({ message: 'position and description are required' });
    }

    const skills = Array.isArray(skillsRequired)
      ? skillsRequired.map(s => String(s).trim()).filter(Boolean)
      : (typeof skillsRequired === 'string'
        ? skillsRequired.split(',').map(s => s.trim()).filter(Boolean)
        : []);

    const payload = {
      position: String(position).trim(),
      description: String(description).trim(),
      yearsOfExperienceRequired: Number.isFinite(Number(yearsOfExperienceRequired))
        ? Number(yearsOfExperienceRequired) : 0,
      skillsRequired: skills,
      department: department ? String(department).trim() : undefined,
      location: location ? String(location).trim() : undefined,
      postedBy, 
    };

    const job = await Job.create(payload);
    
    return res.status(201).json({ message: 'Job created', job });
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.errors });
    }
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

export async function getAllJobs(req, res) {
  try {
    const jobs = await Job.find(
      {},
      '_id position department location yearsOfExperienceRequired description createdAt postedBy'
    ).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ jobs });
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}





export async function getJobById(req, res) {
  try {
    const { id } = req.params;

    console.log("[getJobById] param id =", id);

    if (!mongoose.isValidObjectId(id)) {
      console.warn("[getJobById] invalid ObjectId:", id);
      return res.status(400).json({ message: "Invalid job id" });
    }

    if (!Job) {
      console.error("[getJobById] Job model is undefined (import problem)");
      return res.status(500).json({ message: "Model not loaded" });
    }

    const job = await Job.findById(id)
      .select("position description yearsOfExperienceRequired skillsRequired department location postedBy createdAt ")
      .lean();

    if (!job) {
      console.warn("[getJobById] not found:", id);
      return res.status(404).json({ message: "Job not found" });
    }

    console.log("[getJobById] OK:", id);
    return res.json(job);
  } catch (err) {
    console.error("[getJobById] ERROR:", err?.name, err?.message, err?.stack);
    return res.status(500).json({ message: "Failed to fetch job" });
  }
}


