import React from 'react';

import Badges from '../../images/claim_badges.svg';

const ClaimCommunityMessage: React.FC = () => {
  return (
    <div className="claim-community-message-container">
      <img src={Badges} alt="badges" />
      <h2 className="claim-community-title">Your community can use POAP too</h2>
      <p className="claim-community-subtitle">
        {/*todo: ask for this url*/}
        Fill out <a href="https://poap.xyz">this form</a> and we will reach out to you
      </p>
    </div>
  );
};

export default ClaimCommunityMessage;
