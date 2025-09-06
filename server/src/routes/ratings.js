import { Router } from "express";
import ClinicalRating from "../models/ClinicalRating.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { ok, created, fail } from "../middleware/respond.js";

const router = Router();
router.use(verifyAuth);

/**
 * @openapi
 * /api/ratings:
 *   get:
 *     summary: List clinical ratings
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: therapist
 *         schema: { type: string }
 *       - in: query
 *         name: supervisor
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ratings list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ClinicalRating' }
 */
router.get("/", async (req, res) => {
  try {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
    if (skipDb) {
      const { limit = 20, page = 1 } = req.query;
      return ok(res, { data: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } });
    }
    const { therapist, supervisor, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (therapist) filter.therapist = therapist;
    if (supervisor) filter.supervisor = supervisor;

    const docs = await ClinicalRating.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('therapist', 'name email')
      .populate('supervisor', 'name email')
      .select('therapist supervisor period scores createdAt')
      .lean();

    const total = await ClinicalRating.countDocuments(filter);
    const pages = Math.ceil(total / Number(limit)) || 0;
    return ok(res, { data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages } });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const rating = await ClinicalRating.create(req.body);
    return created(res, { data: rating });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
  if (skipDb) return fail(res, 404, "Clinical rating not found");
    const rating = await ClinicalRating.findById(req.params.id)
      .populate('therapist', 'name email')
      .populate('supervisor', 'name email');
    if (!rating) return fail(res, 404, "Clinical rating not found");
    return ok(res, { data: rating });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

export default router;
