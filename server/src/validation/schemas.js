import { z } from 'zod';

// Common primitives
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/i, 'Invalid object id');
export const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');

// Patients
export const patientContactSchema = z.object({
  phone: z
    .string()
    .regex(/^[0-9\s\-()]{10,20}$/)
    .transform((v) => v.trim())
    .optional(),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1).max(100).optional(),
      phone: z.string().min(5).max(30).optional(),
      relationship: z.string().min(1).max(50).optional(),
    })
    .partial()
    .optional(),
});

export const patientCreateSchema = z.object({
  name: z.string().min(2).max(100),
  dob: isoDate,
  contact: patientContactSchema,
  diagnoses: z.array(z.string().min(1).max(200)).max(10).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  assignedTherapist: objectId.optional(),
  supervisor: objectId.optional(),
  caseStatus: z.enum(['active', 'paused', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().max(2000).optional(),
  lastSessionDate: isoDate.optional(),
  nextAppointment: isoDate.optional(),
});

export const patientUpdateSchema = patientCreateSchema.partial();

// Users
const availabilitySchema = z
  .object({
    weeklySlots: z.number().min(0).max(80).optional(),
    schedule: z
      .object({
        monday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
        tuesday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
        wednesday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
        thursday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
        friday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
        saturday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
        sunday: z.object({ start: z.string().optional(), end: z.string().optional() }).partial().optional(),
      })
      .partial()
      .optional(),
    timeZone: z.string().optional(),
  })
  .partial();

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['therapist', 'supervisor', 'admin']),
  specialties: z.array(z.string().min(1).max(50)).max(15).optional(),
  availability: availabilitySchema.optional(),
  active: z.boolean().optional(),
  licenseNumber: z.string().regex(/^[A-Z0-9]{5,20}$/).optional(),
  phone: z
    .string()
    .regex(/^[0-9\s\-()]{10,20}$/)
    .transform((v) => v.trim())
    .optional(),
  department: z.string().max(200).optional(),
  hireDate: isoDate.optional(),
  preferences: z
    .object({
      notifications: z
        .object({
          email: z.boolean().optional(),
          inApp: z.boolean().optional(),
        })
        .partial()
        .optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
    })
    .partial()
    .optional(),
});

export const userUpdateSchema = userCreateSchema.partial();

// Assignments
export const autoAssignSchema = z.object({
  patientId: objectId,
});

export const manualAssignSchema = z.object({
  patientId: objectId,
  therapistId: objectId,
  reason: z.string().max(200).optional(),
});

export const unassignSchema = z.object({
  reason: z.string().max(200).optional(),
});

// Notifications
export const systemAlertSchema = z.object({
  targetUsers: z.array(objectId).min(1),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export default {
  patientCreateSchema,
  patientUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
  autoAssignSchema,
  manualAssignSchema,
  unassignSchema,
  systemAlertSchema,
};
