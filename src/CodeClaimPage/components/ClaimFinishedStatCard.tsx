import React from 'react';

const ClaimFinishedStatCard: React.FC<{ text: string; stat: string }> = ({ text, stat }) => {
  return (
    <div className="claim-finished-stat-card">
      <div className="claim-finished-stat-card-text-icon">
        <div className="claim-finished-stat-card-text">{text}</div>
      </div>
      <div className="claim-finished-stat-card-stat">{stat}</div>
    </div>
  );
};

export default ClaimFinishedStatCard;
