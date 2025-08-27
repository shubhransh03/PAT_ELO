import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';
import Assignment from './src/models/Assignment.js';
import TherapyPlan from './src/models/TherapyPlan.js';
import Session from './src/models/Session.js';
import ProgressReport from './src/models/ProgressReport.js';
import ClinicalRating from './src/models/ClinicalRating.js';
import Notification from './src/models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/therapy_casemgmt';

// Sample data
const sampleUsers = [
  // Admins
  {
    clerkUserId: 'admin_001',
    email: 'admin@therapycenter.com',
    name: 'Dr. Sarah Thompson',
    role: 'admin',
    specialties: [],
    availability: { weeklySlots: 40 },
    active: true
  },
  
  // Supervisors
  {
    clerkUserId: 'supervisor_001',
    email: 'supervisor1@therapycenter.com',
    name: 'Dr. Michael Rodriguez',
    role: 'supervisor',
    specialties: ['Clinical Psychology', 'Cognitive Behavioral Therapy'],
    availability: { weeklySlots: 35 },
    active: true
  },
  {
    clerkUserId: 'supervisor_002',
    email: 'supervisor2@therapycenter.com',
    name: 'Dr. Emily Chen',
    role: 'supervisor',
    specialties: ['Rehabilitation Psychology', 'Neuropsychology'],
    availability: { weeklySlots: 35 },
    active: true
  },
  
  // Therapists
  {
    clerkUserId: 'therapist_001',
    email: 'therapist1@therapycenter.com',
    name: 'Alex Johnson',
    role: 'therapist',
    specialties: ['Physical Therapy', 'Sports Rehabilitation'],
    availability: { 
      weeklySlots: 32,
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '15:00' }
      }
    },
    active: true,
    yearsExperience: 5
  },
  {
    clerkUserId: 'therapist_002',
    email: 'therapist2@therapycenter.com',
    name: 'Maria Garcia',
    role: 'therapist',
    specialties: ['Occupational Therapy', 'Hand Therapy'],
    availability: { 
      weeklySlots: 30,
      schedule: {
        monday: { start: '08:00', end: '16:00' },
        tuesday: { start: '08:00', end: '16:00' },
        wednesday: { start: '08:00', end: '16:00' },
        thursday: { start: '08:00', end: '16:00' },
        friday: { start: '08:00', end: '14:00' }
      }
    },
    active: true,
    yearsExperience: 8
  },
  {
    clerkUserId: 'therapist_003',
    email: 'therapist3@therapycenter.com',
    name: 'David Kim',
    role: 'therapist',
    specialties: ['Speech Therapy', 'Swallowing Disorders'],
    availability: { 
      weeklySlots: 28,
      schedule: {
        monday: { start: '10:00', end: '18:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '10:00', end: '18:00' },
        thursday: { start: '10:00', end: '18:00' }
      }
    },
    active: true,
    yearsExperience: 3
  },
  {
    clerkUserId: 'therapist_004',
    email: 'therapist4@therapycenter.com',
    name: 'Lisa Wong',
    role: 'therapist',
    specialties: ['Cognitive Behavioral Therapy', 'Anxiety Disorders'],
    availability: { 
      weeklySlots: 35,
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' }
      }
    },
    active: true,
    yearsExperience: 7
  },
  {
    clerkUserId: 'therapist_005',
    email: 'therapist5@therapycenter.com',
    name: 'Robert Taylor',
    role: 'therapist',
    specialties: ['Orthopedic Rehabilitation', 'Manual Therapy'],
    availability: { weeklySlots: 25 },
    active: true,
    yearsExperience: 12
  }
];

const samplePatients = [
  {
    name: 'John Smith',
    dob: new Date('1985-03-15'),
    contact: {
      phone: '5555550101',
      email: 'john.smith@email.com',
      address: '123 Main St, City, State 12345'
    },
    diagnoses: ['Lower Back Pain', 'Sciatica'],
    tags: ['chronic-pain', 'mobility-issues'],
    caseStatus: 'active'
  },
  {
    name: 'Emma Wilson',
    dob: new Date('1992-07-22'),
    contact: {
      phone: '5555550102',
      email: 'emma.wilson@email.com',
      address: '456 Oak Ave, City, State 12345'
    },
    diagnoses: ['Carpal Tunnel Syndrome', 'Tendonitis'],
    tags: ['repetitive-strain', 'work-related'],
    caseStatus: 'active'
  },
  {
    name: 'Michael Brown',
    dob: new Date('1978-11-08'),
    contact: {
      phone: '5555550103',
      email: 'michael.brown@email.com',
      address: '789 Pine St, City, State 12345'
    },
    diagnoses: ['Stroke Recovery', 'Aphasia'],
    tags: ['neurological', 'speech-impairment'],
    caseStatus: 'active'
  },
  {
    name: 'Sarah Davis',
    dob: new Date('1990-05-14'),
    contact: {
      phone: '5555550104',
      email: 'sarah.davis@email.com',
      address: '321 Elm St, City, State 12345'
    },
    diagnoses: ['Anxiety Disorder', 'PTSD'],
    tags: ['mental-health', 'trauma'],
    caseStatus: 'active'
  },
  {
    name: 'James Miller',
    dob: new Date('1965-09-30'),
    contact: {
      phone: '5555550105',
      email: 'james.miller@email.com',
      address: '654 Maple Ave, City, State 12345'
    },
    diagnoses: ['Knee Replacement Recovery', 'Arthritis'],
    tags: ['post-surgical', 'joint-replacement'],
    caseStatus: 'active'
  },
  {
    name: 'Jennifer Garcia',
    dob: new Date('1988-12-03'),
    contact: {
      phone: '5555550106',
      email: 'jennifer.garcia@email.com',
      address: '987 Cedar St, City, State 12345'
    },
    diagnoses: ['Sports Injury', 'ACL Reconstruction'],
    tags: ['sports-medicine', 'athlete'],
    caseStatus: 'active'
  },
  {
    name: 'Robert Johnson',
    dob: new Date('1972-01-18'),
    contact: {
      phone: '5555550107',
      email: 'robert.johnson@email.com',
      address: '147 Birch Ln, City, State 12345'
    },
    diagnoses: ['Chronic Fatigue Syndrome', 'Fibromyalgia'],
    tags: ['chronic-condition', 'pain-management'],
    caseStatus: 'paused'
  },
  {
    name: 'Amanda Lee',
    dob: new Date('1995-08-25'),
    contact: {
      phone: '5555550108',
      email: 'amanda.lee@email.com',
      address: '258 Spruce St, City, State 12345'
    },
    diagnoses: ['Concussion', 'Post-Concussion Syndrome'],
    tags: ['brain-injury', 'cognitive-issues'],
    caseStatus: 'active'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Assignment.deleteMany({}),
      TherapyPlan.deleteMany({}),
      Session.deleteMany({}),
      ProgressReport.deleteMany({}),
      ClinicalRating.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // Create users
    console.log('👥 Creating users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} users`);

    // Create patients
    console.log('🏥 Creating patients...');
    const patients = await Patient.insertMany(samplePatients);
    console.log(`✅ Created ${patients.length} patients`);

    // Get specific users for assignments
    const supervisors = users.filter(u => u.role === 'supervisor');
    const therapists = users.filter(u => u.role === 'therapist');

    // Create assignments
    console.log('📋 Creating assignments...');
    const assignments = [];
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const therapist = therapists[i % therapists.length];
      const supervisor = supervisors[i % supervisors.length];

      // Update patient with assignments
      await Patient.findByIdAndUpdate(patient._id, {
        assignedTherapist: therapist._id,
        supervisor: supervisor._id
      });

      // Create assignment record
      const assignment = await Assignment.create({
        patient: patient._id,
        therapist: therapist._id,
        supervisor: supervisor._id,
        method: i % 2 === 0 ? 'auto' : 'manual',
        rationale: i % 2 === 0 ? 
          `Auto-assigned based on specialty match and availability` :
          `Manually assigned by supervisor for continuity of care`,
        score: i % 2 === 0 ? Math.random() * 100 : undefined
      });

      assignments.push(assignment);
    }
    console.log(`✅ Created ${assignments.length} assignments`);

    // Create therapy plans
    console.log('📝 Creating therapy plans...');
    const therapyPlans = [];
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const therapist = therapists[i % therapists.length]; // Get the same therapist assigned
      
      const statuses = ['draft', 'submitted', 'approved', 'needs_revision'];
      const status = statuses[i % statuses.length];
      
      const goals = [
        { title: 'Reduce Pain', metric: 'pain_level', target: 3 },
        { title: 'Improve Mobility', metric: 'range_of_motion', target: 80 },
        { title: 'Increase Strength', metric: 'muscle_strength', target: 4 }
      ];
      
      const activities = [
        { name: 'Stretching Exercises', frequency: 'Daily', duration: '15 minutes' },
        { name: 'Strength Training', frequency: '3x per week', duration: '30 minutes' },
        { name: 'Mobility Work', frequency: '2x per week', duration: '20 minutes' }
      ];

      const plan = await TherapyPlan.create({
        patient: patient._id,
        therapist: therapist._id,
        status,
        goals,
        activities,
        notes: `Treatment plan for ${patient.diagnoses.join(', ')}`,
        submittedAt: status !== 'draft' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        reviewedAt: status === 'approved' || status === 'needs_revision' ? 
          new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000) : null,
        supervisorComments: status === 'needs_revision' ? 
          'Please add more specific timeline and measurable outcomes' : null
      });

      therapyPlans.push(plan);
    }
    console.log(`✅ Created ${therapyPlans.length} therapy plans`);

    // Create sessions
    console.log('💪 Creating sessions...');
    const sessions = [];
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const therapist = therapists[i % therapists.length]; // Get the same therapist assigned
      const sessionCount = Math.floor(Math.random() * 15) + 5; // 5-20 sessions
      
      for (let j = 0; j < sessionCount; j++) {
        const sessionDate = new Date(Date.now() - (sessionCount - j) * 7 * 24 * 60 * 60 * 1000); // Weekly sessions going back
        
        const session = await Session.create({
          patient: patient._id,
          therapist: therapist._id,
          date: sessionDate,
          durationMin: 45 + Math.floor(Math.random() * 30), // 45-75 minutes
          activities: ['Assessment', 'Therapeutic Exercises', 'Manual Therapy'],
          observations: `Patient showing ${j > 5 ? 'good' : 'gradual'} improvement in target areas`,
          outcomes: [
            { metric: 'pain_level', value: Math.max(1, 8 - Math.floor(j / 2)) },
            { metric: 'range_of_motion', value: Math.min(100, 40 + j * 3) },
            { metric: 'muscle_strength', value: Math.min(5, 2 + Math.floor(j / 3)) }
          ],
          nextSteps: j < sessionCount - 1 ? 'Continue current protocol' : 'Consider discharge planning'
        });
        
        sessions.push(session);
      }
    }
    console.log(`✅ Created ${sessions.length} sessions`);

    // Create progress reports
    console.log('📊 Creating progress reports...');
    const progressReports = [];
    
    for (let i = 0; i < Math.floor(patients.length / 2); i++) { // Only for some patients
      const patient = patients[i];
      const therapist = therapists[i % therapists.length]; // Get the same therapist assigned
      const supervisor = supervisors[i % supervisors.length]; // Get the same supervisor assigned
      
      const report = await ProgressReport.create({
        patient: patient._id,
        therapist: therapist._id,
        sessionCount: 10 + i,
        metricsSummary: [
          { metric: 'pain_level', trend: 'improving', currentValue: 4 - i },
          { metric: 'range_of_motion', trend: 'improving', currentValue: 60 + i * 10 },
          { metric: 'muscle_strength', trend: 'stable', currentValue: 3 + Math.floor(i / 2) }
        ],
        narrative: `Patient has shown consistent improvement over the past ${10 + i} sessions. Pain levels have decreased significantly, and functional mobility has improved.`,
        recommendation: i < 2 ? 'Continue current treatment plan' : 'Begin discharge planning',
        overallProgress: 0.6 + (i * 0.1),
        submittedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        reviewedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
        supervisorFeedback: Math.random() > 0.5 ? 'Good progress documentation. Continue current approach.' : null
      });
      
      progressReports.push(report);
    }
    console.log(`✅ Created ${progressReports.length} progress reports`);

    // Create clinical ratings
    console.log('⭐ Creating clinical ratings...');
    const clinicalRatings = [];
    
    for (let i = 0; i < therapists.length; i++) {
      const therapist = therapists[i];
      const supervisor = supervisors[i % supervisors.length];
      
      const rating = await ClinicalRating.create({
        therapist: therapist._id,
        supervisor: supervisor._id,
        period: 'Q1 2024',
        scores: {
          clinicalSkills: 4 + Math.random(),
          communication: 4 + Math.random(),
          professionalism: 4.5 + Math.random() * 0.5,
          documentation: 3.5 + Math.random() * 1.5,
          patientCare: 4.2 + Math.random() * 0.8
        },
        overallScore: 4 + Math.random(),
        comments: `${therapist.name} demonstrates strong clinical skills and excellent patient rapport. Areas for growth include documentation timeliness.`,
        improvementAreas: ['Documentation efficiency', 'Time management'],
        strengths: ['Patient communication', 'Clinical assessment', 'Treatment planning']
      });
      
      clinicalRatings.push(rating);
    }
    console.log(`✅ Created ${clinicalRatings.length} clinical ratings`);

    // Create sample notifications
    console.log('🔔 Creating notifications...');
    const notifications = [];
    
    // Plan submission notifications
    for (let i = 0; i < 3; i++) {
      const therapist = therapists[i];
      const supervisor = supervisors[i % supervisors.length];
      
      const notification = await Notification.create({
        toUser: supervisor._id,
        fromUser: therapist._id,
        type: 'plan_submitted',
        title: 'New Therapy Plan Submitted',
        message: `${therapist.name} has submitted a therapy plan for review`,
        payload: {
          entityType: 'TherapyPlan',
          entityId: therapyPlans[i]._id
        },
        read: Math.random() > 0.5,
        priority: 'medium'
      });
      
      notifications.push(notification);
    }

    // Progress report due notifications
    for (let i = 0; i < 2; i++) {
      const therapist = therapists[i + 2];
      
      const notification = await Notification.create({
        toUser: therapist._id,
        type: 'report_due',
        title: 'Progress Report Due',
        message: `Progress report is due for ${patients[i + 2].name}`,
        payload: {
          entityType: 'Patient',
          entityId: patients[i + 2]._id
        },
        read: false,
        priority: 'high'
      });
      
      notifications.push(notification);
    }
    
    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📊 Summary:
- Users: ${users.length} (${supervisors.length} supervisors, ${therapists.length} therapists)
- Patients: ${patients.length}
- Assignments: ${assignments.length}
- Therapy Plans: ${therapyPlans.length}
- Sessions: ${sessions.length}
- Progress Reports: ${progressReports.length}
- Clinical Ratings: ${clinicalRatings.length}
- Notifications: ${notifications.length}
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
