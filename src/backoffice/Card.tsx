import React from 'react';
import { Link } from 'react-router-dom';

import CardCover from '../images/backoffice-card-cover.svg';

const Card: React.FC<{ logo: string; title: string; url: string }> = ({ logo, title, url }) => {
  return (
    <div className="card-container">
      <Link to={url} className="card-url">
        <div className="card-header">
          <img src={CardCover} alt="cover" className="card-cover" />
          <div className="card-image-container">
            <img src={logo} alt={title} className="card-image" />
          </div>
        </div>
        <div className="card-title">{title}</div>
      </Link>
    </div>
  );
};

export default Card;
