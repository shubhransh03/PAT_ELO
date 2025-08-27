import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../api';

const Settings = () => {
  const [importFile, setImportFile] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');

  // Import data mutation
  const importMutation = useMutation({
    mutationFn: (formData) => apiPost('/api/integrations/import', formData),
    onSuccess: () => {
      alert('Data imported successfully!');
      setImportFile(null);
    },
    onError: (error) => {
      alert(`Import failed: ${error.message}`);
    },
  });

  const handleImport = (event) => {
    event.preventDefault();
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);
    importMutation.mutate(formData);
  };

  const handleExport = () => {
    // In a real app, this would trigger a download
    alert(`Exporting all data as ${exportFormat.toUpperCase()}...`);
  };

  const handleBackup = () => {
    // In a real app, this would trigger a backup
    alert('Creating backup of all collections...');
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
        <div className="grid grid-2">
          <div className="form-section">
            <h4>Import Data</h4>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label>Select File (CSV/JSON):</label>
                <input 
                  type="file" 
                  className="form-control"
                  accept=".csv,.json"
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
              </div>
              <div className="form-group">
                <label>Data Type:</label>
                <select className="form-control">
                  <option value="patients">Patients</option>
                  <option value="users">Users</option>
                  <option value="sessions">Sessions</option>
                  <option value="plans">Therapy Plans</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={!importFile || importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : 'Import Data'}
              </button>
            </form>
          </div>

          <div className="form-section">
            <h4>Export Data</h4>
            <div className="form-group">
              <label>Export Format:</label>
              <select 
                className="form-control"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF Report</option>
              </select>
            </div>
            <div className="form-group">
              <label>Include:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" defaultChecked />
                  Patient data
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" defaultChecked />
                  Session records
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" />
                  User information
                </label>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleExport}>
              Export Data
            </button>
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
