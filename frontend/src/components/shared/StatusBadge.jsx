import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'online': return 'hosts-badge-active';
      case 'stale': return 'hosts-badge-warning';
      case 'offline': return 'hosts-badge-inactive';
      default: return 'hosts-badge-inactive';
    }
  };

  const getDotClass = (status) => {
    switch (status) {
      case 'online': return 'hosts-dot-active';
      case 'stale': return 'hosts-dot-warning';
      case 'offline': return 'hosts-dot-inactive';
      default: return 'hosts-dot-inactive';
    }
  };

  const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

  return (
    <span className={`hosts-badge ${getBadgeClass(status)}`}>
      <span className={`hosts-badge-dot ${getDotClass(status)}`} />
      {formattedStatus}
    </span>
  );
};
