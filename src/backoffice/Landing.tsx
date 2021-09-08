import React from 'react';
import { authClient } from '../auth';

import CalendarIcon from '../images/backoffice-calendar-icon.svg';
import CodeIcon from '../images/backoffice-code-icon.svg';
import RequestIcon from '../images/backoffice-manage-codes-request-icon.svg';
import DeliveriesIcon from '../images/backoffice-delivery-icon.svg';
import { ROUTES } from '../lib/constants';
import Card from './Card';

const Landing: React.FC = () => {
  const isAdmin = authClient.isAuthenticated();

  const cards = [
    {
      title: 'Manage Events',
      image: CalendarIcon,
      isAdmin: false,
      url: ROUTES.events.path,
    },
    {
      title: 'Manage Codes',
      image: CodeIcon,
      isAdmin: false,
      url: ROUTES.codes.path,
    },
    {
      title: 'Manage Codes Requests',
      image: RequestIcon,
      isAdmin: true,
      url: ROUTES.codesRequest.path,
    },
    {
      title: 'Manage Deliveries Requests',
      image: DeliveriesIcon,
      isAdmin: true,
      url: ROUTES.deliveries.requests.path,
    },
  ];

  return (
    <div className="backoffice-landing container">
      {cards.map((x) => (
        <Card logo={x.image} title={x.title} url={x.url} key={x.url} />
      ))}
    </div>
  );
};

export default Landing;
