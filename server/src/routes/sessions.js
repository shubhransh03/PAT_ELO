import { Router } from "express";
import mongoose from "mongoose";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { verifyAuth } from "../middleware/verifyAuth.js";

const router = Router();
router.use(verifyAuth);

function isValidObjectId(id) { return mongoose.Types.ObjectId.isValid(id); }
async function resolveTherapistId(raw) {
  if (!raw) return null;
  if (isValidObjectId(raw)) return raw;
  if (raw.includes('@')) { // email shortcut
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

    const docs = await Session.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ date: -1 })
      .populate('patient', 'name')
      .populate('therapist', 'name email');

    const total = await Session.countDocuments(filter);
    res.json({ data: docs, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    // default therapist to auth user if absent
    if (!data.therapist && req.auth?.userId) {
      data.therapist = req.auth.userId;
    }
    if (!data.therapist) {
      return res.status(400).json({ error: 'Therapist is required.' });
    }
    if (!isValidObjectId(data.therapist)) {
      const resolved = await resolveTherapistId(data.therapist);
      if (!resolved) return res.status(400).json({ error: `Unknown therapist id: ${data.therapist}` });
      data.therapist = resolved;
    }
    const session = await Session.create(data);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('patient', 'name')
      .populate('therapist', 'name email');
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.therapist && !isValidObjectId(updates.therapist)) {
      const resolved = await resolveTherapistId(updates.therapist);
      if (!resolved) return res.status(400).json({ error: `Unknown therapist id: ${updates.therapist}` });
      updates.therapist = resolved;
    }
    const session = await Session.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
