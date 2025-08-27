import { Router } from "express";
import Assignment from "../models/Assignment.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import assignmentService from "../services/assignmentService.js";
import notificationService from "../services/notificationService.js";
import { verifyAuth } from "../middleware/verifyAuth.js";

const router = Router();
router.use(verifyAuth);

/**
 * GET /api/assignments
 * Get assignment history with filtering
 */
router.get("/", async (req, res) => {
  try {
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
      .populate('supervisor', 'name email');
    
    const total = await Assignment.countDocuments(filter);
    
    res.json({ 
      success: true,
      data: docs, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/assignments/auto-assign
 * Automatically assign a patient to the best-matched therapist
 */
router.post("/auto-assign", async (req, res) => {
  try {
    // Check if user is supervisor or admin
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ 
        success: false, 
        error: "Only supervisors and admins can assign patients" 
      });
    }

    const { patientId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: "Patient ID is required" 
      });
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

    res.status(201).json({
      success: true,
      data: result,
      message: 'Patient assigned automatically'
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/assignments/manual-assign
 * Manually assign a patient to a specific therapist
 */
router.post("/manual-assign", async (req, res) => {
  try {
    // Check if user is supervisor or admin
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ 
        success: false, 
        error: "Only supervisors and admins can assign patients" 
      });
    }

    const { patientId, therapistId, reason } = req.body;
    
    if (!patientId || !therapistId) {
      return res.status(400).json({ 
        success: false, 
        error: "Patient ID and Therapist ID are required" 
      });
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

    res.status(201).json({
      success: true,
      data: assignment,
      message: `Patient ${isReassignment} successfully`
    });
  } catch (error) {
    console.error('Manual assign error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/assignments/patient/:patientId/history
 * Get assignment history for a specific patient
 */
router.get("/patient/:patientId/history", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const history = await assignmentService.getAssignmentHistory(patientId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Assignment history error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/assignments/stats
 * Get assignment statistics for reporting
 */
router.get("/stats", async (req, res) => {
  try {
    // Check permissions - supervisors and admins only
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for assignment statistics'
      });
    }

    const { startDate, endDate } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await assignmentService.getAssignmentStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Assignment stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/assignments/:id/unassign
 * Unassign a patient from their current therapist
 */
router.post("/:id/unassign", async (req, res) => {
  try {
    // Check if user is supervisor or admin
    if (!['supervisor', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ 
        success: false, 
        error: "Only supervisors and admins can unassign patients" 
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Find the assignment
    const assignment = await Assignment.findById(id).populate(['patient', 'therapist']);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
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

    res.json({
      success: true,
      data: unassignment,
      message: 'Patient unassigned successfully'
    });
  } catch (error) {
    console.error('Unassign error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
