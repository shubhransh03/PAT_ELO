import { Router } from "express";
import mongoose from "mongoose";
import TherapyPlan from "../models/TherapyPlan.js";
import User from "../models/User.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { z, validateBody } from "../middleware/validate.js";
import { ok, fail, created } from "../middleware/respond.js";

const router = Router();
router.use(verifyAuth);

// Helper to determine if a string is a valid Mongo ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Resolve a possible Clerk user id (e.g. "user_xxx") to internal Mongo _id
async function resolveTherapistId(raw) {
  if (!raw) return null;
  if (isValidObjectId(raw)) return raw; // already an ObjectId string
  // Common Clerk patterns: user_xxx, usr_xxx
  const candidates = [raw];
  // Allow passing an email for convenience in dev
  if (raw.includes('@')) {
    const byEmail = await User.findOne({ email: raw.toLowerCase() });
    if (byEmail) return byEmail._id;
  }
  for (const c of candidates) {
    const user = await User.findOne({ clerkUserId: c });
    if (user) return user._id;
  }
  return null;
}

router.get("/", async (req, res) => {
  try {
    const skipDb = (process.env.SKIP_DB || '').toLowerCase() === 'true' || process.env.SKIP_DB === '1';
  if (skipDb) return ok(res, { data: [], total: 0 });
    const { patient, therapist, status, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (patient) filter.patient = patient; // assume UI sends ObjectId for patient
    if (therapist) {
      let therapistKey = therapist;
      if (therapist === 'me' && req.auth?.userId) therapistKey = req.auth.userId;
      const resolved = await resolveTherapistId(therapistKey);
      if (resolved) {
        filter.therapist = resolved;
      } else {
        // Unresolvable therapist id -> return empty set instead of 400 (frontend expects 200)
        return res.json({ data: [], total: 0, unresolvedTherapist: therapist });
      }
    }
    if (status) filter.status = status;

    const docs = await TherapyPlan.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ updatedAt: -1 })
      .populate('patient', 'name')
      .populate('therapist', 'name email')
      .select('patient therapist status updatedAt submittedAt reviewedAt')
      .lean();

  const total = await TherapyPlan.countDocuments(filter);
  const pages = Math.ceil(total / Number(limit)) || 0;
  return ok(res, { data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages } });
  } catch (error) {
  return fail(res, 500, error.message);
  }
});
/**
 * @openapi
 * /api/plans:
 *   get:
 *     summary: List therapy plans
 *     tags: [Therapy Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema: { type: string }
 *       - in: query
 *         name: therapist
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plans list
 */

const createPlanSchema = z.object({
  patient: z.string().min(1),
  therapist: z.string().optional(),
  status: z.enum(["draft","submitted","approved","needs_revision"]).optional(),
  goals: z.array(z.object({ title: z.string().min(1), metric: z.string().optional(), target: z.number().optional() })).optional(),
  activities: z.array(z.object({ name: z.string().min(1), frequency: z.string().optional(), duration: z.string().optional() })).optional(),
  notes: z.string().max(2000).optional(),
  attachments: z.array(z.string()).optional()
});

router.post("/", validateBody(createPlanSchema), async (req, res) => {
  try {
    const data = { ...req.body };
    // If therapist not provided, default to authenticated user (common UX expectation)
    if (!data.therapist && req.auth?.userId) {
      data.therapist = req.auth.userId;
    }
    if (!data.therapist) {
      return res.status(400).json({ error: 'Therapist is required (missing body.therapist and no auth user).' });
    }
    if (!isValidObjectId(data.therapist)) {
      const resolved = await resolveTherapistId(data.therapist);
      if (!resolved) return res.status(400).json({ error: `Unknown therapist id: ${data.therapist}` });
      data.therapist = resolved;
    }
  const plan = await TherapyPlan.create(data);
  return created(res, { data: plan });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const plan = await TherapyPlan.findById(req.params.id)
      .populate('patient', 'name')
      .populate('therapist', 'name email');
  if (!plan) return fail(res, 404, "Therapy plan not found");
  return ok(res, { data: plan });
  } catch (error) {
  return fail(res, 500, error.message);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.therapist && !isValidObjectId(data.therapist)) {
      const resolved = await resolveTherapistId(data.therapist);
      if (!resolved) return res.status(400).json({ error: `Unknown therapist id: ${data.therapist}` });
      data.therapist = resolved;
    }
    const plan = await TherapyPlan.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!plan) return fail(res, 404, "Therapy plan not found");
  return ok(res, { data: plan });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

router.post("/:id/submit", async (req, res) => {
  try {
    const plan = await TherapyPlan.findByIdAndUpdate(
      req.params.id,
      { status: "submitted", submittedAt: new Date() },
      { new: true }
    );
  if (!plan) return fail(res, 404, "Therapy plan not found");
  return ok(res, { data: plan });
  } catch (error) {
  return fail(res, 500, error.message);
  }
});

router.post("/:id/review", async (req, res) => {
  try {
    const { decision, comments } = req.body; // decision: 'approved' | 'needs_revision'
    const plan = await TherapyPlan.findByIdAndUpdate(
      req.params.id,
      { status: decision, reviewedAt: new Date(), supervisorComments: comments },
      { new: true }
    );
  if (!plan) return fail(res, 404, "Therapy plan not found");
  return ok(res, { data: plan });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

export default router;
