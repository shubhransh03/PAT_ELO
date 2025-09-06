import mongoose from "mongoose";

const ClinicalRatingSchema = new mongoose.Schema(
  {
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    period: String,
    scores: Object,
    comments: String,
  },
  { timestamps: true }
);

// Indexes for trend and performance analytics
ClinicalRatingSchema.index({ therapist: 1, createdAt: -1 });
ClinicalRatingSchema.index({ createdAt: -1 });

export default mongoose.model("ClinicalRating", ClinicalRatingSchema);
