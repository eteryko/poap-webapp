import React from 'react';

import Spinner from '../../images/claim-spinner.svg';

const ClaimingMessage: React.FC = () => {
  return (
    <div className="claim-claiming-message-container">
      <img src={Spinner} alt="spinner" className="spinner" />
      <p>The POAP token is on its way to your wallet </p>
    </div>
  );
};

export default ClaimingMessage;
