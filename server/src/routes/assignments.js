import { Router } from "express";
import rateLimit from "express-rate-limit";
import Assignment from "../models/Assignment.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import assignmentService from "../services/assignmentService.js";
import notificationService from "../services/notificationService.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { ok, created, fail } from "../middleware/respond.js";
import { validateBody } from "../middleware/validate.js";
import { autoAssignSchema, manualAssignSchema, unassignSchema } from "../validation/schemas.js";

const router = Router();
router.use(verifyAuth);

// Per-route rate limits (auth-heavy endpoints stricter)
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 150, standardHeaders: true, legacyHeaders: false });

/**
 * GET /api/assignments
 * Get assignment history with filtering
 */
/**
 * @openapi
 * /api/assignments:
 *   get:
 *     summary: List assignments
 *     tags: [Assignments]
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
 *         description: Assignments list
 */
router.get("/", readLimiter, async (req, res) => {
  try {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
    if (skipDb) {
      const { limit = 20, page = 1 } = req.query;
      return ok(res, { data: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } });
    }
    const { patient, therapist, method, limit = 20, page = 1 } = req.query;
    const filter = {};
    
    if (patient) filter.patient = patient;
    if (therapist) filter.therapist = therapist;
    if (method) filter.method = method;
    
    const docs = await Assignment.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('patient', 'name caseStatus')
      .populate('therapist', 'name email')
      .populate('supervisor', 'name email')
      .select('patient therapist supervisor method rationale createdAt')
      .lean();
    
    const total = await Assignment.countDocuments(filter);
    
  return ok(res, { data: docs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get assignments error:', error);
  return fail(res, 500, error.message);
  }
});

/**
 * POST /api/assignments/auto-assign
 * Automatically assign a patient to the best-matched therapist
 */
router.post("/auto-assign", writeLimiter, validateBody(autoAssignSchema), async (req, res) => {
  try {
    // Check if user is supervisor or admin
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return fail(res, 403, "Only supervisors and admins can assign patients");
    }

    const { patientId } = req.body;
    
    if (!patientId) {
      return fail(res, 400, "Patient ID is required");
    }

    // Use the assignment service for automated assignment
    const result = await assignmentService.autoAssignPatient(
      patientId, 
      req.auth.userId
    );

    // Send notification to assigned therapist
    const patient = await Patient.findById(patientId);
    await notificationService.notifyAssignmentChanged(
      result.assignment.therapist._id,
      patientId,
      patient.name,
      'assigned'
    );

  return created(res, { data: result, message: 'Patient assigned automatically' });
  } catch (error) {
    console.error('Auto-assign error:', error);
  return fail(res, 500, error.message);
  }
});

/**
 * POST /api/assignments/manual-assign
 * Manually assign a patient to a specific therapist
 */
router.post("/manual-assign", writeLimiter, validateBody(manualAssignSchema), async (req, res) => {
  try {
    // Check if user is supervisor or admin
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return fail(res, 403, "Only supervisors and admins can assign patients");
    }

    const { patientId, therapistId, reason } = req.body;
    
    if (!patientId || !therapistId) {
      return fail(res, 400, "Patient ID and Therapist ID are required");
    }

    // Use the assignment service for manual assignment
    const assignment = await assignmentService.manualAssignPatient(
      patientId,
      therapistId,
      req.auth.userId,
      reason
    );

    // Send notification to assigned therapist
    const patient = await Patient.findById(patientId);
    const isReassignment = assignment.previousTherapist ? 'reassigned' : 'assigned';
    
    await notificationService.notifyAssignmentChanged(
      therapistId,
      patientId,
      patient.name,
      isReassignment
    );

  return created(res, { data: assignment, message: `Patient ${isReassignment} successfully` });
  } catch (error) {
    console.error('Manual assign error:', error);
  return fail(res, 500, error.message);
  }
});

/**
 * GET /api/assignments/patient/:patientId/history
 * Get assignment history for a specific patient
 */
/**
 * @openapi
 * /api/assignments/patient/{patientId}/history:
 *   get:
 *     summary: Get assignment history for a patient
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: History entries
 */
router.get("/patient/:patientId/history", readLimiter, async (req, res) => {
  try {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
  if (skipDb) return ok(res, { data: [] });
    const { patientId } = req.params;
    
    const history = await assignmentService.getAssignmentHistory(patientId);
  return ok(res, { data: history });
  } catch (error) {
    console.error('Assignment history error:', error);
  return fail(res, 500, error.message);
  }
});

/**
 * GET /api/assignments/stats
 * Get assignment statistics for reporting
 */
router.get("/stats", readLimiter, async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
  return fail(res, 403, 'Insufficient permissions for assignment statistics');
    }

    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const skipDb = !isProd && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1');
    if (skipDb) {
      // Return a harmless stub in dev without DB
      return ok(res, { data: { totalAssignments: 0, reassignments: 0, byMethod: { auto: 0, manual: 0 } } });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await assignmentService.getAssignmentStats(filters);

  return ok(res, { data: stats });
  } catch (error) {
    console.error('Assignment stats error:', error);
  return fail(res, 500, error.message);
  }
});

/**
 * POST /api/assignments/:id/unassign
 * Unassign a patient from their current therapist
 */
router.post("/:id/unassign", writeLimiter, validateBody(unassignSchema), async (req, res) => {
  try {
    // Check if user is supervisor or admin
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return fail(res, 403, "Only supervisors and admins can unassign patients");
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Find the assignment
    const assignment = await Assignment.findById(id).populate(['patient', 'therapist']);
    
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    // Update patient to remove assignment
    await Patient.findByIdAndUpdate(assignment.patient._id, {
      $unset: { assignedTherapist: 1 }
    });

    // Create an unassignment record
    const unassignment = await Assignment.create({
      patient: assignment.patient._id,
      therapist: null,
      supervisor: req.auth.userId,
      method: 'manual',
      rationale: `Unassigned by supervisor: ${reason || 'No reason provided'}`,
      previousTherapist: assignment.therapist._id
    });

    // Send notification to former therapist
    await notificationService.createSystemAlert(
      assignment.therapist._id,
      'Patient Unassigned',
      `Patient ${assignment.patient.name} has been unassigned from your caseload`,
      'medium'
    );

  return ok(res, { data: unassignment, message: 'Patient unassigned successfully' });
  } catch (error) {
    console.error('Unassign error:', error);
  return fail(res, 500, error.message);
  }
});

export default router;
