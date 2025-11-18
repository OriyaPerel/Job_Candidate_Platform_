import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    yearsExperience: { type: Number, min: 0, default: 0 },
    about: { type: String, trim: true },
    jobsLookingFor: [{ type: String, trim: true }],
    embedding: { type: [Number], default: null },
    
    passwordHash: { type: String }, 
    googleId: { type: String },    
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
