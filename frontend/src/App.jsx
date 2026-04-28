import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Hosts from './components/Hosts';
import HostDetails from './components/HostDetails';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedHostId, setSelectedHostId] = useState(null);
  const [selectedHostName, setSelectedHostName] = useState('');
  const [stats, setStats] = useState({
    totalHosts: 0,
    totalPackages: 0,
    passedChecks: 0,
    failedChecks: 0,
    compliancePercent: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/summary`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Backend server not responding. Ensure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigateToHostDetails = (id, name) => {
    setSelectedHostId(id);
    setSelectedHostName(name);
    setCurrentPage('host-details');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>Linux Security Compliance</h1>
          <p>Continuous security monitoring & CIS benchmarking</p>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${currentPage === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`btn ${currentPage === 'hosts' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentPage('hosts')}
          >
            Hosts
          </button>
        </nav>
      </header>

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <>
          {currentPage === 'dashboard' && (
            <Dashboard stats={stats} onNavigateToHosts={() => setCurrentPage('hosts')} />
          )}
          
          {currentPage === 'hosts' && (
            <Hosts onViewDetails={navigateToHostDetails} />
          )}

          {currentPage === 'host-details' && (
            <HostDetails hostId={selectedHostId} hostname={selectedHostName} onBack={() => setCurrentPage('hosts')} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
