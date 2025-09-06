import { Router } from "express";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { ok, created, fail } from "../middleware/respond.js";
import { validateBody } from "../middleware/validate.js";
import { userCreateSchema, userUpdateSchema } from "../validation/schemas.js";

const router = Router();
router.use(verifyAuth);

// Per-route rate limits
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/User' }
 *       401: { description: Unauthorized }
 */
router.get("/", readLimiter, async (req, res) => {
  try {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
    if (skipDb) {
      const { limit = 20, page = 1 } = req.query;
      return ok(res, { data: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } });
    }
    const { role, active, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';

    const docs = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .select('name email role active createdAt')
      .lean();

    const total = await User.countDocuments(filter);
    const pages = Math.ceil(total / Number(limit)) || 0;
    return ok(res, { data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages } });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

router.get("/me", readLimiter, async (req, res) => {
  try {
    return ok(res, { userId: req.auth.userId, role: req.auth.role });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

router.post("/", writeLimiter, validateBody(userCreateSchema), async (req, res) => {
  try {
    const user = await User.create(req.body);
    return created(res, { data: user });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

router.get("/:id", readLimiter, async (req, res) => {
  try {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
  if (skipDb) return fail(res, 404, "User not found");
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "User not found");
    return ok(res, { data: user });
  } catch (error) {
    return fail(res, 500, error.message);
  }
});

router.patch("/:id", writeLimiter, validateBody(userUpdateSchema), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return fail(res, 404, "User not found");
    return ok(res, { data: user });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

export default router;
