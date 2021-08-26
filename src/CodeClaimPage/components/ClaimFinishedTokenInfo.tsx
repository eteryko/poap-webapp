import React from 'react';

import CheckIconTransparent from '../../images/claim_check_transparent-.svg';
import CalendarIcon from '../../images/calendar_icon.svg';
import BadgeIcon from '../../images/badge_icon.svg';
import { getNumberWithOrdinal, timeSince } from 'lib/helpers';
import { format } from 'date-fns';

const ClaimFinishedTokenInfo: React.FC<{ eventId: number; order: number; claimedDateString: string }> = ({
  eventId,
  order,
  claimedDateString,
}) => {
  const claimedDate: Date = new Date(claimedDateString);

  const poapGalleryUrl = () => {
    return `https://poap.gallery/event/${eventId}`;
  };

  return (
    <div className="claim-finished-info-container">
      <div className="claim-congrats-container">
        <img src={CheckIconTransparent} alt="check-icon" />
        <p>Congratulations! This POAP was added to your collection.</p>
      </div>
      <div className="claim-finished-info">
        <img src={CalendarIcon} alt="calendar" />
        <p>
          This POAP was minted {timeSince(claimedDate)} ago on {format(claimedDate, 'MMMM do, yyyy')}.
        </p>
      </div>
      {order > 0 && (
        <div className="claim-finished-info">
          <img src={BadgeIcon} alt="calendar" />
          <p>
            This is the {getNumberWithOrdinal(order)} POAP of this event! To see who else has this POAP{' '}
            <a href={poapGalleryUrl()}>click here</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default ClaimFinishedTokenInfo;
