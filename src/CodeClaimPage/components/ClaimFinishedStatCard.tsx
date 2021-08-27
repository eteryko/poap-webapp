import React from 'react';

const ClaimFinishedStatCard: React.FC<{ text: string; stat: string; icon?: string; iconText?: string }> = ({
  text,
  stat,
  icon,
  iconText,
}) => {
  return (
    <div className="claim-finished-stat-card">
      <div className="claim-finished-stat-card-text-icon">
        {icon && <img src={icon} alt="icon" className="claim-finished-stat-card-icon" />}
        {!icon && iconText && <div className="claim-finished-stat-card-icon-text">{iconText}</div>}
        <div className="claim-finished-stat-card-text">{text}</div>
      </div>
      <div className="claim-finished-stat-card-stat">{stat}</div>
    </div>
  );
};

export default ClaimFinishedStatCard;
