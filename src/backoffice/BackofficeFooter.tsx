import React from 'react';

import PoapLogo from '../images/POAP.svg';

const BackofficeFooter: React.FC = () => {
  return (
    <div className="backoffice-footer">
      <img src={PoapLogo} alt="logo" className="backoffice-footer-logo" />
      <div className="backoffice-footer-ecosystem">
        <div className="backoffice-footer-title">POAP Ecosystem</div>
        <div className="backoffice-footer-ecosystem-col">
          <a href="https://poap.xyz" target="_blank" rel="noopener noreferrer">
            poap.xyz
          </a>
          <a href="https://poap.gallery" target="_blank" rel="noopener noreferrer">
            poap.gallery
          </a>
          <a href="https://poap.fun" target="_blank" rel="noopener noreferrer">
            poap.fun
          </a>
        </div>
        <div className="backoffice-footer-ecosystem-col">
          <a href="https://poap.vote" target="_blank" rel="noopener noreferrer">
            poap.vote
          </a>
          <a href="https://poap.delivery" target="_blank" rel="noopener noreferrer">
            poap.delivery
          </a>
          <a href="https://poap.chat" target="_blank" rel="noopener noreferrer">
            poap.chat
          </a>
        </div>
        <div className="backoffice-footer-ecosystem-col">
          <a href="https://app.poap.xyz" target="_blank" rel="noopener noreferrer">
            poap.app
          </a>
          <a href="https://poap.art" target="_blank" rel="noopener noreferrer">
            poap.art
          </a>
        </div>
      </div>
      <div className="backoffice-footer-communities">
        <div className="backoffice-footer-title">Join our community!</div>
      </div>
    </div>
  );
};

export default BackofficeFooter;
