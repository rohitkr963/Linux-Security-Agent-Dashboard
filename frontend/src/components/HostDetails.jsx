import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

function HostDetails({ hostId, hostname, onBack }) {
  const [activeTab, setActiveTab] = useState('packages');
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

  if (loading) return <div className="loading">Loading details for {hostname}...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={onBack}>&larr; Back to Hosts</button>
        <h2>Host Profile: {hostname}</h2>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'packages' ? 'active' : ''}`} 
          onClick={() => setActiveTab('packages')}
        >
          Installed Packages ({packages.length})
        </div>
        <div 
          className={`tab ${activeTab === 'cis' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cis')}
        >
          CIS Benchmark Results ({cisResults.length})
        </div>
      </div>

      {activeTab === 'packages' && (
        <div>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search packages by name or version..." 
            value={searchPkg}
            onChange={(e) => setSearchPkg(e.target.value)}
          />

          <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Package Name</th>
                  <th>Version</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 500 }}>{pkg.name}</td>
                    <td><code>{pkg.version}</code></td>
                  </tr>
                ))}
                {filteredPackages.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No packages match your search.
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
                <th>Check Name</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Evidence</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {cisResults.map((check, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600, maxWidth: '300px' }}>{check.name}</td>
                  <td>
                    <span className={`badge ${check.status === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
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
                      background: '#f1f5f9', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      whiteSpace: 'pre-wrap',
                      maxWidth: '400px'
                    }}>
                      {check.evidence || 'N/A'}
                    </pre>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
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
