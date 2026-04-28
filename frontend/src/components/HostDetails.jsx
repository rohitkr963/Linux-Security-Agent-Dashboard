import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

const Icons = {
  Package: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  )
};

function HostDetails({ hostId, hostname, onBack }) {
  const [activeTab, setActiveTab] = useState('cis'); // Default to CIS checks for SOC feel
  const [packages, setPackages] = useState([]);
  const [cisResults, setCisResults] = useState([]);
  const [searchPkg, setSearchPkg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [pkgRes, cisRes] = await Promise.all([
          fetch(`${API_URL}/hosts/${hostId}/packages`),
          fetch(`${API_URL}/hosts/${hostId}/cis-results`)
        ]);
        
        if (pkgRes.ok) setPackages(await pkgRes.json());
        if (cisRes.ok) setCisResults(await cisRes.json());
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [hostId]);

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchPkg.toLowerCase()) || 
    pkg.version.toLowerCase().includes(searchPkg.toLowerCase())
  );

  if (loading) return <div className="loading">Retrieving security posture database...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={onBack}>
            &larr; Back
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Endpoint Audit: <code>{hostname}</code></h2>
        </div>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'cis' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cis')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Shield /> CIS Benchmark Controls ({cisResults.length})</span>
        </div>
        <div 
          className={`tab ${activeTab === 'packages' ? 'active' : ''}`} 
          onClick={() => setActiveTab('packages')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Package /> Software Inventory ({packages.length})</span>
        </div>
      </div>

      {activeTab === 'packages' && (
        <div>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--text-muted)' }}><Icons.Search /></span>
            <input 
              type="text" 
              className="search-input" 
              style={{ paddingLeft: '2.5rem', marginBottom: '1.25rem' }}
              placeholder="Filter by application name..." 
              value={searchPkg}
              onChange={(e) => setSearchPkg(e.target.value)}
            />
          </div>

          <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Component Identifier</th>
                  <th>Installed Version</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{pkg.name}</td>
                    <td><code style={{ color: 'var(--primary-accent)' }}>{pkg.version}</code></td>
                  </tr>
                ))}
                {filteredPackages.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No matching dependencies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cis' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Benchmark Definition</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th>System Evidence</th>
                <th>Remediation Path</th>
              </tr>
            </thead>
            <tbody>
              {cisResults.map((check, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600, maxWidth: '280px', color: '#1e293b' }}>{check.name}</td>
                  <td>
                    <span className={`badge ${check.status === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                      <span className={`badge-dot ${check.status === 'PASS' ? 'bg-success' : 'bg-danger'}`} />
                      {check.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${check.severity === 'High' ? 'badge-danger' : check.severity === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                      {check.severity}
                    </span>
                  </td>
                  <td>
                    <pre style={{ 
                      fontSize: '0.75rem', 
                      background: '#f8fafc', 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border)',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      color: '#475569',
                      maxWidth: '350px'
                    }}>
                      {check.evidence || 'N/A'}
                    </pre>
                  </td>
                  <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)', maxWidth: '250px', lineHeight: '1.4' }}>
                    {check.recommendation}
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

export default HostDetails;
