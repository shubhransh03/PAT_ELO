import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    durationMin: Number,
    activities: [String],
    observations: String,
    outcomes: [{ metric: String, value: Number }],
    nextSteps: String,
  },
  { timestamps: true }
);

// Indexes for date-based and user-based lookups
SessionSchema.index({ therapist: 1, date: -1 });
SessionSchema.index({ patient: 1, date: -1 });
SessionSchema.index({ createdAt: -1 });

export default mongoose.model("Session", SessionSchema);
