import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  position: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  yearsOfExperienceRequired: { type: Number, default: 0, min: 0 },
  skillsRequired: { type: [String], default: [] },
  department: { type: String, trim: true },
  location:   { type: String, trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  embedding: { type: [Number], default: null }
}, { timestamps: true });// Automatically adds createdAt and updatedAt timestamps for each document


export default mongoose.model('Job', JobSchema);
