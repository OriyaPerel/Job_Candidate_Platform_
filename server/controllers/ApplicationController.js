import mongoose from "mongoose";
import ApplicationModel from "../models/ApplicationModel.js";
import Job from "../models/JobModel.js";
import User from "../models/UserModel.js";

export async function createApplication(req, res) {
  try {
    console.log('🟢 Received POST /applications');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    const candidateId = req.user?._id;
    const { jobId } = req.body;

    if (!candidateId) {
      console.log('❌ Missing candidateId (user not authenticated)');
      return res.status(401).json({ message: 'Not authenticated (missing candidateId)' });
    }

    if (!jobId) {
      console.log('❌ Missing jobId');
      return res.status(400).json({ message: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.log('❌ Job not found in DB');
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = await ApplicationModel.create({
      candidate: candidateId,
      job: jobId,
    });

    console.log('✅ Application created:', application._id);
    return res.status(201).json({ message: 'Application created', application });

  } catch (error) {
    console.error('🔥 Error creating application:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
export async function getMyApplications(req, res) {
  try {
    const candidateId = req.user?._id;
    if (!candidateId) return res.status(401).json({ message: 'Not authenticated' });

    const applications = await ApplicationModel.find({ candidate: candidateId })
      .populate('job', 'position location department createdAt')
      .lean();

    return res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
