import React from 'react';

/* Assets */
import ClaimCover from '../../images/claim_cover_blue.svg';
// import ClaimCoverSuccess from "../../images/claim_cover_blue.svg";

/*
 * @dev: Common header for QR claim system
 * */
const ClaimHeader: React.FC<{ title: string; image?: string; claimed?: boolean }> = ({
  title,
  image,
  claimed = true,
}) => {
  return (
    <div className={'claim-header'}>
      <img src={ClaimCover} alt="cover" className="claim-cover" />
      <div className="claim-title-logo-container">
        <div className="logo-event">
          <img src={image} alt="event" />
        </div>
        <div className={'title'}>{title}</div>
      </div>
    </div>
  );
};

export default ClaimHeader;
