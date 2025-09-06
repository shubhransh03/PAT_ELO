import { Router } from "express";
import rateLimit from "express-rate-limit";
import Patient from "../models/Patient.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { ok, created, fail } from "../middleware/respond.js";
import { validateBody } from "../middleware/validate.js";
import { patientCreateSchema, patientUpdateSchema } from "../validation/schemas.js";

const router = Router();
router.use(verifyAuth);

// Per-route rate limits
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

/**
 * @openapi
 * /api/patients:
 *   get:
 *     summary: List patients
 *     tags:
 *       - Patients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Patient' }
 */
router.get("/", readLimiter, async (req, res) => {
  try {
    const skipDb = (process.env.SKIP_DB || '').toLowerCase() === 'true' || process.env.SKIP_DB === '1';
    const { q, status, limit = 20, page = 1 } = req.query;
    if (skipDb) return ok(res, { data: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } });
    const filter = {};
    if (q) filter.name = { $regex: q, $options: "i" };
    if (status) filter.caseStatus = status;

    const docs = await Patient.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ updatedAt: -1 })
      .populate('assignedTherapist', 'name email')
      .populate('supervisor', 'name email')
      .select('name caseStatus assignedTherapist supervisor updatedAt createdAt')
      .lean();

    const total = await Patient.countDocuments(filter);
    const pages = Math.ceil(total / Number(limit)) || 0;
    return ok(res, { data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages } });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

router.post("/", writeLimiter, validateBody(patientCreateSchema), async (req, res) => {
  try {
    const doc = await Patient.create(req.body);
    return created(res, { data: doc });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

router.get("/:id", readLimiter, async (req, res) => {
  try {
    const doc = await Patient.findById(req.params.id)
      .populate('assignedTherapist', 'name email')
      .populate('supervisor', 'name email');
    if (!doc) return fail(res, 404, "Patient not found");
    return ok(res, { data: doc });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

router.put("/:id", writeLimiter, validateBody(patientUpdateSchema), async (req, res) => {
  try {
    const doc = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return fail(res, 404, "Patient not found");
    return ok(res, { data: doc });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

router.delete("/:id", writeLimiter, async (req, res) => {
  try {
    const doc = await Patient.findByIdAndDelete(req.params.id);
    if (!doc) return fail(res, 404, "Patient not found");
    return ok(res, { message: "Patient deleted successfully" });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

export default router;
