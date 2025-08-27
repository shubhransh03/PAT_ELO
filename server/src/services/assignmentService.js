import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Assignment from '../models/Assignment.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Automated Patient Assignment Service
 * Implements the algorithmic assignment of patients to therapists
 */
class AssignmentService {
  
  /**
   * Auto-assign a patient to the best-matched therapist
   * @param {string} patientId - Patient ID to assign
   * @param {string} supervisorId - Supervisor making the assignment
   * @returns {Object} Assignment result with therapist and rationale
   */
  async autoAssignPatient(patientId, supervisorId) {
    try {
      // Get patient details
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get available therapists
      const therapists = await User.find({
        role: 'therapist',
        active: true
      }).populate('assignments');

      if (therapists.length === 0) {
        throw new Error('No available therapists found');
      }

      // Calculate scores for each therapist
      const scoredTherapists = await Promise.all(
        therapists.map(async (therapist) => {
          const score = await this.calculateTherapistScore(patient, therapist);
          return {
            therapist,
            score: score.total,
            breakdown: score.breakdown
          };
        })
      );

      // Sort by score (highest first)
      scoredTherapists.sort((a, b) => b.score - a.score);
      
      const bestMatch = scoredTherapists[0];
      
      if (bestMatch.score <= 0) {
        throw new Error('No suitable therapist found for this patient');
      }

      // Create assignment
      const assignment = await Assignment.create({
        patient: patientId,
        therapist: bestMatch.therapist._id,
        supervisor: supervisorId,
        method: 'auto',
        rationale: this.generateRationale(bestMatch, patient),
        score: bestMatch.score,
        scoreBreakdown: bestMatch.breakdown
      });

      // Update patient assignment
      await Patient.findByIdAndUpdate(patientId, {
        assignedTherapist: bestMatch.therapist._id,
        supervisor: supervisorId
      });

      // Log audit entry
      await AuditLog.logAction(
        supervisorId,
        'assign_patient',
        'Assignment',
        assignment._id,
        {
          patientId,
          therapistId: bestMatch.therapist._id,
          method: 'auto',
          score: bestMatch.score
        }
      );

      return {
        assignment: await assignment.populate(['patient', 'therapist', 'supervisor']),
        score: bestMatch.score,
        rationale: assignment.rationale
      };

    } catch (error) {
      console.error('Auto-assignment error:', error);
      throw error;
    }
  }

  /**
   * Manually assign/reassign a patient to a therapist
   * @param {string} patientId - Patient ID
   * @param {string} therapistId - Therapist ID
   * @param {string} supervisorId - Supervisor making the assignment
   * @param {string} reason - Reason for manual assignment
   * @returns {Object} Assignment result
   */
  async manualAssignPatient(patientId, therapistId, supervisorId, reason) {
    try {
      // Validate entities exist
      const [patient, therapist, supervisor] = await Promise.all([
        Patient.findById(patientId),
        User.findById(therapistId),
        User.findById(supervisorId)
      ]);

      if (!patient) throw new Error('Patient not found');
      if (!therapist || therapist.role !== 'therapist') throw new Error('Invalid therapist');
      if (!supervisor || !['supervisor', 'admin'].includes(supervisor.role)) {
        throw new Error('Unauthorized: Only supervisors can assign patients');
      }

      // Check if patient is already assigned to this therapist
      if (patient.assignedTherapist?.toString() === therapistId) {
        throw new Error('Patient is already assigned to this therapist');
      }

      // Create new assignment
      const assignment = await Assignment.create({
        patient: patientId,
        therapist: therapistId,
        supervisor: supervisorId,
        method: 'manual',
        rationale: reason || 'Manual assignment by supervisor',
        previousTherapist: patient.assignedTherapist
      });

      // Update patient assignment
      await Patient.findByIdAndUpdate(patientId, {
        assignedTherapist: therapistId,
        supervisor: supervisorId
      });

      // Log audit entry
      await AuditLog.logAction(
        supervisorId,
        patient.assignedTherapist ? 'reassign_patient' : 'assign_patient',
        'Assignment',
        assignment._id,
        {
          patientId,
          therapistId,
          previousTherapistId: patient.assignedTherapist,
          method: 'manual',
          reason
        }
      );

      return await assignment.populate(['patient', 'therapist', 'supervisor']);

    } catch (error) {
      console.error('Manual assignment error:', error);
      throw error;
    }
  }

  /**
   * Calculate compatibility score between patient and therapist
   * @param {Object} patient - Patient document
   * @param {Object} therapist - Therapist document
   * @returns {Object} Score breakdown and total
   */
  async calculateTherapistScore(patient, therapist) {
    const breakdown = {
      specialtyMatch: 0,
      availability: 0,
      caseload: 0,
      experience: 0
    };

    // 1. Specialty matching (40% weight)
    breakdown.specialtyMatch = this.calculateSpecialtyMatch(patient, therapist) * 0.4;

    // 2. Availability score (25% weight)
    breakdown.availability = this.calculateAvailabilityScore(therapist) * 0.25;

    // 3. Caseload score (25% weight)
    breakdown.caseload = await this.calculateCaseloadScore(therapist) * 0.25;

    // 4. Experience score (10% weight)
    breakdown.experience = this.calculateExperienceScore(therapist) * 0.1;

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    return {
      breakdown,
      total
    };
  }

  /**
   * Calculate specialty matching score
   * @param {Object} patient - Patient document
   * @param {Object} therapist - Therapist document
   * @returns {number} Score between 0-100
   */
  calculateSpecialtyMatch(patient, therapist) {
    const patientTags = patient.tags || [];
    const patientDiagnoses = patient.diagnoses || [];
    const therapistSpecialties = therapist.specialties || [];

    if (therapistSpecialties.length === 0) return 50; // Neutral score for generalists

    // Count matches
    const tagMatches = patientTags.filter(tag => 
      therapistSpecialties.some(specialty => 
        specialty.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(specialty.toLowerCase())
      )
    ).length;

    const diagnosisMatches = patientDiagnoses.filter(diagnosis => 
      therapistSpecialties.some(specialty => 
        specialty.toLowerCase().includes(diagnosis.toLowerCase()) ||
        diagnosis.toLowerCase().includes(specialty.toLowerCase())
      )
    ).length;

    const totalMatches = tagMatches + diagnosisMatches;
    const totalItems = patientTags.length + patientDiagnoses.length;

    if (totalItems === 0) return 50; // Neutral if patient has no specific needs

    // Calculate percentage match with bonus for multiple matches
    const matchRatio = totalMatches / totalItems;
    const bonusMultiplier = totalMatches > 1 ? 1.2 : 1.0;
    
    return Math.min(100, matchRatio * 100 * bonusMultiplier);
  }

  /**
   * Calculate availability score based on weekly slots
   * @param {Object} therapist - Therapist document
   * @returns {number} Score between 0-100
   */
  calculateAvailabilityScore(therapist) {
    const availability = therapist.availability;
    if (!availability || !availability.weeklySlots) return 50;

    const weeklySlots = availability.weeklySlots;
    
    // Score based on available time slots
    if (weeklySlots >= 40) return 100;
    if (weeklySlots >= 30) return 80;
    if (weeklySlots >= 20) return 60;
    if (weeklySlots >= 10) return 40;
    return 20;
  }

  /**
   * Calculate caseload score (lower caseload = higher score)
   * @param {Object} therapist - Therapist document
   * @returns {number} Score between 0-100
   */
  async calculateCaseloadScore(therapist) {
    const currentCaseload = await Patient.countDocuments({
      assignedTherapist: therapist._id,
      caseStatus: 'active'
    });

    // Ideal caseload is around 15-20 patients
    if (currentCaseload >= 25) return 10;
    if (currentCaseload >= 20) return 40;
    if (currentCaseload >= 15) return 80;
    if (currentCaseload >= 10) return 100;
    if (currentCaseload >= 5) return 90;
    return 70; // Very low caseload might indicate other issues
  }

  /**
   * Calculate experience score based on join date and specialties
   * @param {Object} therapist - Therapist document
   * @returns {number} Score between 0-100
   */
  calculateExperienceScore(therapist) {
    const yearsExperience = therapist.yearsExperience || 0;
    const specialtyCount = (therapist.specialties || []).length;

    // Base score from years of experience
    let score = Math.min(80, yearsExperience * 10);
    
    // Bonus for multiple specialties (up to 20 points)
    score += Math.min(20, specialtyCount * 5);

    return Math.min(100, score);
  }

  /**
   * Generate human-readable rationale for assignment
   * @param {Object} bestMatch - Best matched therapist with score
   * @param {Object} patient - Patient document
   * @returns {string} Rationale text
   */
  generateRationale(bestMatch, patient) {
    const { therapist, breakdown } = bestMatch;
    const reasons = [];

    if (breakdown.specialtyMatch > 70) {
      reasons.push(`Strong specialty match for ${patient.diagnoses?.join(', ') || 'patient needs'}`);
    }
    
    if (breakdown.availability > 80) {
      reasons.push('High availability');
    }
    
    if (breakdown.caseload > 70) {
      reasons.push('Manageable current caseload');
    }

    if (breakdown.experience > 60) {
      reasons.push('Relevant experience');
    }

    if (reasons.length === 0) {
      reasons.push('Best available match among current therapists');
    }

    return `Assigned to ${therapist.name} based on: ${reasons.join(', ')}.`;
  }

  /**
   * Get assignment history for a patient
   * @param {string} patientId - Patient ID
   * @returns {Array} Assignment history
   */
  async getAssignmentHistory(patientId) {
    return Assignment.find({ patient: patientId })
      .populate(['therapist', 'supervisor'])
      .sort({ createdAt: -1 });
  }

  /**
   * Get assignment statistics for reporting
   * @param {Object} filters - Filter criteria
   * @returns {Object} Assignment statistics
   */
  async getAssignmentStats(filters = {}) {
    const matchFilter = {};
    
    if (filters.startDate) {
      matchFilter.createdAt = { $gte: new Date(filters.startDate) };
    }
    
    if (filters.endDate) {
      matchFilter.createdAt = { 
        ...matchFilter.createdAt, 
        $lte: new Date(filters.endDate) 
      };
    }

    const stats = await Assignment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    return stats;
  }
}

export default new AssignmentService();
