import { Router } from "express";
import mongoose from "mongoose";
import ProgressReport from "../models/ProgressReport.js";
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
  if (raw.includes('@')) {
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

    const docs = await ProgressReport.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ submittedAt: -1 })
      .populate('patient', 'name')
      .populate('therapist', 'name email')
      .select('patient therapist sessionCount submittedAt reviewedAt')
      .lean();

  const total = await ProgressReport.countDocuments(filter);
  const pages = Math.ceil(total / Number(limit)) || 0;
  return ok(res, { data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages } });
  } catch (error) {
  return fail(res, 500, error.message);
  }
});
/**
 * @openapi
 * /api/progress-reports:
 *   get:
 *     summary: List progress reports
 *     tags: [Progress Reports]
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
 *         description: Reports list
 */

const createReportSchema = z.object({
  patient: z.string().min(1),
  therapist: z.string().optional(),
  sessionCount: z.number().int().nonnegative().optional(),
  metricsSummary: z.array(z.object({ metric: z.string(), trend: z.string().optional(), value: z.number().optional() })).optional(),
  narrative: z.string().max(5000).optional(),
  recommendation: z.string().max(2000).optional(),
  submittedAt: z.coerce.date().optional()
});

router.post("/", validateBody(createReportSchema), async (req, res) => {
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
  return created(res, { data: report });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const report = await ProgressReport.findById(req.params.id)
      .populate('patient', 'name')
      .populate('therapist', 'name email');
  if (!report) return fail(res, 404, "Progress report not found");
  return ok(res, { data: report });
  } catch (error) {
  return fail(res, 500, error.message);
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
  if (!report) return fail(res, 404, "Progress report not found");
  return ok(res, { data: report });
  } catch (error) {
  return fail(res, 400, error.message);
  }
});

export default router;
