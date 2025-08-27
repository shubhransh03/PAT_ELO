import React, { useState } from 'react';
import { API_BASE } from '../api';

// NOTE: Import/export here uses direct fetch because endpoints return/accept whole JSON snapshot

const Settings = () => {
  const [importFile, setImportFile] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importWipe, setImportWipe] = useState(false);
  const [message, setMessage] = useState('');
  // Force CSV format only
  const entityFormat = 'csv';
  const [entity, setEntity] = useState('patients');

  const resetMessageLater = () => setTimeout(() => setMessage(''), 5000);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return setMessage('Select a JSON export file first');
    setImporting(true);
    setMessage('Importing...');
    try {
      const text = await importFile.text();
      const json = JSON.parse(text);
      if (importWipe) json.wipe = true;
      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      if (!res.ok) throw new Error(`Import failed (${res.status})`);
      const result = await res.json();
      setMessage(`Import complete. Inserted: users ${result.results?.users?.inserted || 0}, patients ${result.results?.patients?.inserted || 0}`);
      setImportFile(null);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setImporting(false);
      resetMessageLater();
    }
  };

  const handleEntityCSVDownload = async (ent) => {
    const url = `${API_BASE}/api/data/export/${ent}?format=csv`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`Export ${ent} failed (${res.status})`);
    const ctype = res.headers.get('content-type') || '';
    if (ctype.includes('text/html')) throw new Error('Received HTML (likely wrong API base URL)');
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = `${ent}.csv`;
    a.click();
    URL.revokeObjectURL(objUrl);
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage('Exporting all entities (CSV)...');
    try {
      const entities = ['patients', 'users', 'therapyPlans', 'sessions', 'progressReports'];
      for (const ent of entities) {
        // eslint-disable-next-line no-await-in-loop
        await handleEntityCSVDownload(ent);
      }
      setMessage('All CSV files downloaded');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setExporting(false);
      resetMessageLater();
    }
  };

  const handleBackup = () => {
    setMessage('Backup endpoint not implemented yet');
    resetMessageLater();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings & Integrations</h1>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="form-section">
          <h3>System Settings</h3>
          <div className="form-group">
            <label>Session Reminder Threshold:</label>
            <select className="form-control">
              <option value="10">10 sessions</option>
              <option value="15">15 sessions</option>
              <option value="20">20 sessions</option>
            </select>
          </div>
          <div className="form-group">
            <label>Plan Approval Timeout (days):</label>
            <input type="number" className="form-control" defaultValue="7" />
          </div>
          <div className="form-group">
            <label>Default Session Duration (minutes):</label>
            <input type="number" className="form-control" defaultValue="50" />
          </div>
          <button className="btn btn-primary">Save Settings</button>
        </div>

        <div className="form-section">
          <h3>Notification Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" defaultChecked />
              Email notifications for plan submissions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" defaultChecked />
              Reminders for overdue reports
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" />
              Weekly caseload summaries
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" defaultChecked />
              Session completion confirmations
            </label>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Update Notifications
          </button>
        </div>
      </div>

      <div className="form-section">
        <h3>Data Import/Export</h3>
        {message && <div className="status-badge" style={{ marginBottom: '0.75rem' }}>{message}</div>}
        <div className="grid grid-2">
          <div className="form-section">
            <h4>Import Data (export.json)</h4>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label>Select JSON Export:</label>
                <input
                  type="file"
                  className="form-control"
                  accept="application/json,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="wipe" checked={importWipe} onChange={(e) => setImportWipe(e.target.checked)} />
                <label htmlFor="wipe" style={{ margin: 0 }}>Wipe existing data before import</label>
              </div>
              <button
                type="submit"
                className="btn btn-success"
                disabled={!importFile || importing}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </form>
          </div>
          <div className="form-section">
            <h4>Export (CSV)</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Downloads one CSV per entity (patients, users, therapy plans, sessions, progress reports).</p>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Download All CSVs'}
            </button>
            <hr style={{ margin: '1rem 0' }} />
            <h4>Single Entity CSV</h4>
            <div className="form-group">
              <label>Entity:</label>
              <select className="form-control" value={entity} onChange={e => setEntity(e.target.value)}>
                <option value="patients">Patients</option>
                <option value="users">Users</option>
                <option value="therapyPlans">Therapy Plans</option>
                <option value="sessions">Sessions</option>
                <option value="progressReports">Progress Reports</option>
              </select>
            </div>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  setMessage('Exporting entity...');
                  await handleEntityCSVDownload(entity);
                  setMessage('Entity export downloaded');
                  resetMessageLater();
                } catch (err) {
                  setMessage(err.message);
                  resetMessageLater();
                }
              }}
            >Download CSV</button>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>External Integrations</h3>
        <div className="grid grid-2">
          <div className="form-section">
            <h4>Hospital System Integration</h4>
            <p>Connect with external hospital/clinic systems</p>
            <div className="form-group">
              <label>API Endpoint:</label>
              <input
                className="form-control"
                placeholder="https://api.hospital.com/v1"
                disabled
              />
            </div>
            <div className="form-group">
              <label>API Key:</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter API key"
                disabled
              />
            </div>
            <button className="btn btn-secondary" disabled>
              Configure (Coming Soon)
            </button>
          </div>

          <div className="form-section">
            <h4>Billing System Integration</h4>
            <p>Sync with billing and insurance systems</p>
            <div className="form-group">
              <label>Billing Provider:</label>
              <select className="form-control" disabled>
                <option>Select provider...</option>
                <option>Epic MyChart</option>
                <option>Cerner PowerChart</option>
                <option>Custom Integration</option>
              </select>
            </div>
            <button className="btn btn-secondary" disabled>
              Configure (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Data Management</h3>
        <div className="grid grid-3">
          <div className="form-section">
            <h4>Backup</h4>
            <p>Create a backup of all system data</p>
            <button className="btn btn-primary" onClick={handleBackup}>
              Create Backup
            </button>
          </div>

          <div className="form-section">
            <h4>Database Stats</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>Patients: <strong>156</strong></li>
              <li>Users: <strong>24</strong></li>
              <li>Sessions: <strong>1,247</strong></li>
              <li>Plans: <strong>89</strong></li>
            </ul>
          </div>

          <div className="form-section">
            <h4>System Health</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Database:</span>
                <span className="status-badge status-active">Healthy</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>API:</span>
                <span className="status-badge status-active">Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Storage:</span>
                <span className="status-badge status-draft">85% Used</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
