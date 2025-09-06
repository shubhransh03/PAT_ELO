import { Router } from "express";
import mongoose from "mongoose";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { z, validateBody } from "../middleware/validate.js";
import { ok, fail, created } from "../middleware/respond.js";

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
    const skipDb = (process.env.SKIP_DB || '').toLowerCase() === 'true' || process.env.SKIP_DB === '1';
  if (skipDb) return ok(res, { data: [], total: 0 });
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
      .populate('therapist', 'name email')
      .select('patient therapist date durationMin')
      .lean();

  const total = await Session.countDocuments(filter);
  const pages = Math.ceil(total / Number(limit)) || 0;
  return ok(res, { data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages } });
  } catch (error) {
  return fail(res, 500, error.message);
  }
});
/**
 * @openapi
 * /api/sessions:
 *   get:
 *     summary: List sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema: { type: string }
 *       - in: query
 *         name: therapist
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sessions list
 */

const createSessionSchema = z.object({
  patient: z.string().min(1),
  therapist: z.string().optional(),
  date: z.coerce.date(),
  durationMin: z.number().int().nonnegative().optional(),
  activities: z.array(z.string()).optional(),
  observations: z.string().max(2000).optional(),
  outcomes: z.array(z.object({ metric: z.string(), value: z.number() })).optional(),
  nextSteps: z.string().max(2000).optional()
});

router.post("/", validateBody(createSessionSchema), async (req, res) => {
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
  return created(res, { data: session });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('patient', 'name')
      .populate('therapist', 'name email');
  if (!session) return fail(res, 404, "Session not found");
  return ok(res, { data: session });
  } catch (error) {
  return fail(res, 500, error.message);
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
  if (!session) return fail(res, 404, "Session not found");
  return ok(res, { data: session });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

export default router;
