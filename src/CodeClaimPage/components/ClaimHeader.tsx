import React from 'react';

/* Assets */
import ClaimCover from '../../images/claim_cover_blue.svg';
import ClaimCoverSuccess from '../../images/claim_cover_green.svg';
import CheckGreen from '../../images/check_green.svg';

/*
 * @dev: Common header for QR claim system
 * */
const ClaimHeader: React.FC<{ title: string; image?: string; claimed?: boolean; success?: boolean }> = ({
  title,
  image,
  claimed = true,
  success,
}) => {
  return (
    <div className={'claim-header'}>
      <img src={success ? ClaimCoverSuccess : ClaimCover} alt="cover" className="claim-cover" />
      <div className="claim-title-logo-container">
        <div className="logo-event">
          <img src={image} alt="event" className="logo-img" />
          {success && <img src={CheckGreen} alt="check!" className="check" />}
        </div>
        <h1 className="claim-title">{title}</h1>
      </div>
    </div>
  );
};

export default ClaimHeader;
