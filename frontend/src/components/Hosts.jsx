import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

const Icons = {
  Server: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
  )
};

function Hosts({ onViewDetails }) {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await fetch(`${API_URL}/hosts`);
        if (!res.ok) throw new Error('Failed to fetch hosts');
        const data = await res.json();
        setHosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHosts();
  }, []);

  if (loading) return <div className="loading">Querying active fleet...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Monitored Fleet ({hosts.length})</h2>
      </div>

      {hosts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: '#ffffff' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Icons.Server />
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>No Endpoints Detected</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            Run the local Go agent binary on an active terminal to generate automatic machine diagnostics.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hostname</th>
                <th>OS & Architecture</th>
                <th>Private IP</th>
                <th>Status</th>
                <th>Last Ping</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((host) => (
                <tr key={host.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}><Icons.Server /></span>
                      <strong style={{ color: '#0f172a', fontWeight: 600 }}>{host.hostname}</strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.813rem', color: '#334155', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      {host.os_name} {host.os_version}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.813rem', color: 'var(--primary-accent)', fontWeight: 600 }}>
                      {host.ip_address}
                    </code>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <span className="badge-dot bg-success" />
                      Active
                    </span>
                  </td>
                  <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                    {new Date(host.last_seen).toLocaleTimeString()}
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.813rem' }}
                      onClick={() => onViewDetails(host.id, host.hostname)}
                    >
                      Audit Report <Icons.ArrowRight />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Hosts;
