import React from 'react';

export const SkeletonCard = ({ style }) => (
  <div className="skeleton-card" style={style}>
    <div className="skeleton-header"></div>
    <div className="skeleton-body"></div>
  </div>
);

export const SkeletonRow = () => (
  <div className="skeleton-row"></div>
);
