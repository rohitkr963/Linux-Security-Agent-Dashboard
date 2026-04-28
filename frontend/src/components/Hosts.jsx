import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

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

  if (loading) return <div className="loading">Loading hosts...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Monitored Endpoints</h2>

      {hosts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hosts detected yet. Start the Go Agent to begin collection.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hostname</th>
                <th>Operating System</th>
                <th>IP Address</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((host) => (
                <tr key={host.id}>
                  <td style={{ fontWeight: 600 }}>{host.hostname}</td>
                  <td>{host.os_name} {host.os_version}</td>
                  <td><code>{host.ip_address}</code></td>
                  <td>{new Date(host.last_seen).toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => onViewDetails(host.id, host.hostname)}
                    >
                      View Details
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
