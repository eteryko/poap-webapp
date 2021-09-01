import React from 'react';

/* Assets */
import CheckGreen from '../../images/check_green.svg';
import ClaimCover from './ClaimCover';

/*
 * @dev: Common header for QR claim system
 * */
const ClaimHeader: React.FC<{ title: string; eventId: number; image?: string; claimed?: boolean; color?: string }> = ({
  title,
  eventId,
  image,
  claimed,
  color,
}) => {
  const colorClaimed = '#84E6B1';
  const colorNotClaimed = '#ADDEFF';

  const coverColor = (): string => {
    if (color) {
      return color;
    }

    return claimed ? colorClaimed : colorNotClaimed;
  };

  return (
    <div className={'claim-header'}>
      <ClaimCover className="claim-cover" color={coverColor()} />
      <div className="claim-title-logo-container">
        <div className="logo-event">
          <img src={image} alt="event" className="logo-img" />
          {claimed && <img src={CheckGreen} alt="check!" className="check" />}
        </div>
        <h1 className="claim-title">{title}</h1>
        {eventId > 0 && <h2 className="claim-subtitle">#{eventId}</h2>}
      </div>
    </div>
  );
};

export default ClaimHeader;
