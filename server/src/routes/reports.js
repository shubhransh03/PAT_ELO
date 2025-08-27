import { Router } from "express";
import mongoose from "mongoose";
import ProgressReport from "../models/ProgressReport.js";
import User from "../models/User.js";
import { verifyAuth } from "../middleware/verifyAuth.js";

const router = Router();
router.use(verifyAuth);

function isValidObjectId(id) { return mongoose.Types.ObjectId.isValid(id); }
async function resolveTherapistId(raw) {
  if (!raw) return null;
  if (isValidObjectId(raw)) return raw;
  if (raw.includes('@')) {
    const byEmail = await User.findOne({ email: raw.toLowerCase() });
    if (byEmail) return byEmail._id;
  }
  const user = await User.findOne({ clerkUserId: raw });
  return user ? user._id : null;
}

router.get("/", async (req, res) => {
  try {
    const { patient, therapist, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (patient) filter.patient = patient;
    if (therapist) {
      let tKey = therapist;
      if (therapist === 'me' && req.auth?.userId) tKey = req.auth.userId;
      const resolved = await resolveTherapistId(tKey);
      if (resolved) filter.therapist = resolved; else return res.json({ data: [], total: 0, unresolvedTherapist: therapist });
    }

    const docs = await ProgressReport.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ submittedAt: -1 })
      .populate('patient', 'name')
      .populate('therapist', 'name email');

    const total = await ProgressReport.countDocuments(filter);
    res.json({ data: docs, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.therapist && req.auth?.userId) data.therapist = req.auth.userId;
    if (!data.therapist) return res.status(400).json({ error: 'Therapist is required.' });
    if (!isValidObjectId(data.therapist)) {
      const resolved = await resolveTherapistId(data.therapist);
      if (!resolved) return res.status(400).json({ error: `Unknown therapist id: ${data.therapist}` });
      data.therapist = resolved;
    }
    const report = await ProgressReport.create(data);
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const report = await ProgressReport.findById(req.params.id)
      .populate('patient', 'name')
      .populate('therapist', 'name email');
    if (!report) return res.status(404).json({ error: "Progress report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/review", async (req, res) => {
  try {
    const { feedback } = req.body;
    const report = await ProgressReport.findByIdAndUpdate(
      req.params.id,
      { reviewedAt: new Date(), supervisorFeedback: feedback },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: "Progress report not found" });
    res.json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
