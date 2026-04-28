import React from 'react';

function Dashboard({ stats, onNavigateToHosts }) {
  return (
    <div>
      <div className="stats-grid">
        <div className="card">
          <div className="card-title">Total Monitored Hosts</div>
          <div className="card-value">{stats.totalHosts}</div>
        </div>
        
        <div className="card">
          <div className="card-title">Total Packages</div>
          <div className="card-value">{stats.totalPackages}</div>
        </div>

        <div className="card">
          <div className="card-title">Passed Checks</div>
          <div className="card-value" style={{ color: 'var(--success)' }}>{stats.passedChecks}</div>
        </div>

        <div className="card">
          <div className="card-title">Failed Checks</div>
          <div className="card-value" style={{ color: 'var(--danger)' }}>{stats.failedChecks}</div>
        </div>

        <div className="card">
          <div className="card-title">Compliance Score</div>
          <div className="card-value" style={{ color: stats.compliancePercent >= 80 ? 'var(--success)' : stats.compliancePercent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
            {stats.compliancePercent}%
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Welcome to the Security Control Center</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          Your Linux endpoints are actively reporting security posture data. Ensure all failed checks are remediated to maintain compliance.
        </p>
        <button className="btn btn-primary" onClick={onNavigateToHosts}>
          View Managed Hosts
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
