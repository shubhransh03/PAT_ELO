import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    method: { type: String, enum: ["auto", "manual"], required: true },
    rationale: String,
  },
  { timestamps: true }
);

// Indexes to optimize common list filters and sorts
AssignmentSchema.index({ patient: 1, createdAt: -1 });
AssignmentSchema.index({ therapist: 1, createdAt: -1 });
AssignmentSchema.index({ supervisor: 1, createdAt: -1 });
AssignmentSchema.index({ method: 1, createdAt: -1 });

export default mongoose.model("Assignment", AssignmentSchema);
