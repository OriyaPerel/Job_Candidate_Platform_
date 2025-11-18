import mongoose from 'mongoose';


const ApplicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  status: { type: String, enum: ['pending','reviewed','accepted','rejected'], default: 'pending', index: true },
  cvUrl: { type: String }, 
  note: { type: String },
  appliedAt: { type: Date, default: Date.now, index: true },
  embedding: { type: [Number], default: null }
});

ApplicationSchema.index({ candidate: 1, job: 1 }, { unique: true }); 

export default mongoose.model('Application', ApplicationSchema);

  