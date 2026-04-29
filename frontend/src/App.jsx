import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Hosts from './components/Hosts';
import HostDetails from './components/HostDetails';
import { fetchSummary, fetchTrend } from './utils/api';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedHostId, setSelectedHostId] = useState(null);
  const [selectedHostName, setSelectedHostName] = useState('');
  
  const [stats, setStats] = useState({
    totalHosts: 0,
    onlineHosts: 0,
    staleHosts: 0,
    offlineHosts: 0,
    totalPackages: 0,
    passedChecks: 0,
    failedChecks: 0,
    compliancePercent: 100,
    recentAlerts: [],
    recentScans: []
  });
  const [trend, setTrend] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    try {
      const [statsData, trendData] = await Promise.all([
        fetchSummary(),
        fetchTrend()
      ]);
      setStats(statsData);
      setTrend(trendData);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Backend server not responding. Ensure it is running on port 5000.');
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Auto refresh every 10 seconds
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const navigateToHostDetails = (id, name) => {
    setSelectedHostId(id);
    setSelectedHostName(name);
    setCurrentPage('host-details');
  };

  return (
    <div className="app-container">
      <header className="header" style={{ marginBottom: '1.5rem' }}>
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
            Fleet Inventory
          </button>
        </nav>
      </header>

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {currentPage === 'dashboard' && (
        <Dashboard 
          stats={stats} 
          trend={trend}
          loading={loading}
          lastUpdated={lastUpdated}
          onNavigateToHosts={() => setCurrentPage('hosts')} 
        />
      )}
      
      {currentPage === 'hosts' && (
        <Hosts onViewDetails={navigateToHostDetails} />
      )}

      {currentPage === 'host-details' && (
        <HostDetails 
          hostId={selectedHostId} 
          hostname={selectedHostName} 
          onBack={() => setCurrentPage('hosts')} 
        />
      )}
    </div>
  );
}

export default App;
