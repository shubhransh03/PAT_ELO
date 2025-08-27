import { Router } from 'express';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import TherapyPlan from '../models/TherapyPlan.js';
import Session from '../models/Session.js';
import ProgressReport from '../models/ProgressReport.js';
import { verifyAuth } from '../middleware/verifyAuth.js';

const router = Router();
router.use(verifyAuth);

// Simple role guard for admin/supervisor export/import
function requireAdmin(req, res, next) {
    const role = req.auth?.role;
    if (!['admin', 'supervisor'].includes(role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Admin or supervisor role required' });
    }
    next();
}

router.get('/export', requireAdmin, async (req, res) => {
    try {
        const [users, patients, plans, sessions, reports] = await Promise.all([
            User.find().lean(),
            Patient.find().lean(),
            TherapyPlan.find().lean(),
            Session.find().lean(),
            ProgressReport.find().lean()
        ]);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="export.json"');
        res.json({
            meta: {
                exportedAt: new Date().toISOString(),
                versions: { user: 1, patient: 1, plan: 1, session: 1, report: 1 }
            },
            users,
            patients,
            therapyPlans: plans,
            sessions,
            progressReports: reports
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to convert array of objects to CSV string
function toCSV(rows) {
    if (!rows.length) return '';
    const headers = [...new Set(rows.flatMap(r => Object.keys(r)))];
    const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) {
        lines.push(headers.map(h => escape(r[h])).join(','));
    }
    return lines.join('\n');
}

// Generic fetch map
const ENTITY_CONFIG = {
    users: { model: User },
    patients: { model: Patient },
    therapyPlans: { model: TherapyPlan },
    sessions: { model: Session },
    progressReports: { model: ProgressReport }
};

// Per-entity export (JSON or CSV)
router.get('/export/:entity', requireAdmin, async (req, res) => {
    try {
        const { entity } = req.params;
        const { format = 'json' } = req.query;
        const cfg = ENTITY_CONFIG[entity];
        if (!cfg) return res.status(400).json({ error: 'Unknown entity' });
        const docs = await cfg.model.find().lean();
        if (format === 'csv') {
            const flat = docs.map(d => ({
                ...d,
                _id: d._id?.toString(),
                createdAt: d.createdAt?.toISOString?.(),
                updatedAt: d.updatedAt?.toISOString?.()
            }));
            const csv = toCSV(flat);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${entity}.csv"`);
            return res.send(csv);
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${entity}.json"`);
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/import', requireAdmin, async (req, res) => {
    try {
        const { users = [], patients = [], therapyPlans = [], sessions = [], progressReports = [], wipe = false } = req.body || {};

        if (wipe) {
            await Promise.all([
                User.deleteMany({}),
                Patient.deleteMany({}),
                TherapyPlan.deleteMany({}),
                Session.deleteMany({}),
                ProgressReport.deleteMany({})
            ]);
        }

        // Insert ignoring duplicate key errors (best-effort)
        async function safeInsert(Model, docs) {
            if (!Array.isArray(docs) || !docs.length) return { inserted: 0 };
            let inserted = 0;
            for (const d of docs) {
                try {
                    // Strip _id to let Mongo assign new unless provided
                    await Model.create(d);
                    inserted++;
                } catch (e) {
                    if (e.code === 11000) continue; // ignore duplicate
                    console.warn('Import error for', Model.modelName, e.message);
                }
            }
            return { inserted };
        }

        const results = {};
        results.users = await safeInsert(User, users);
        results.patients = await safeInsert(Patient, patients);
        results.therapyPlans = await safeInsert(TherapyPlan, therapyPlans);
        results.sessions = await safeInsert(Session, sessions);
        results.progressReports = await safeInsert(ProgressReport, progressReports);

        res.json({ status: 'ok', results });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
