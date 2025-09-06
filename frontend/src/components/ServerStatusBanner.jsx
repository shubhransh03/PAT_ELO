import React from 'react';
import { useServerStatus } from './ServerStatusProvider.jsx';

export default function ServerStatusBanner() {
  const { ready, dbConnected, skipDb } = useServerStatus();
  if (!ready) return null;
  if (dbConnected) return null;
  return (
    <div style={{
      background: '#fff3cd',
      color: '#664d03',
      padding: '8px 16px',
      borderBottom: '1px solid #ffe69c'
    }}>
      {skipDb ? 'Running without a database (SKIP_DB enabled). Some data is stubbed.' : 'API is up, but database is not connected.'}
    </div>
  );
}
