import mongoose from "mongoose";

const ProgressReportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionCount: Number,
    metricsSummary: [{ metric: String, trend: String, value: Number }],
    narrative: String,
    recommendation: String,
    submittedAt: Date,
    reviewedAt: Date,
    supervisorFeedback: String,
  },
  { timestamps: true }
);

// Indexes for report lookups
ProgressReportSchema.index({ therapist: 1, submittedAt: -1 });
ProgressReportSchema.index({ patient: 1, submittedAt: -1 });
ProgressReportSchema.index({ createdAt: -1 });

export default mongoose.model("ProgressReport", ProgressReportSchema);
