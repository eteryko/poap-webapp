/* eslint jsx-a11y/anchor-is-valid: 0 */
import React, { useContext, useState } from 'react';
import { Link, Redirect, Route, withRouter, Switch } from 'react-router-dom';
import { slide as Menu } from 'react-burger-menu';

// lib
import { AuthContext, authClient } from 'auth';

/* Constants */
import { ROUTES, LABELS } from '../lib/constants';

/* Components */
import { BurnPage } from './BurnPage';
import { IssueForEventPage, IssueForUserPage } from './IssuePage';
import { AddressManagementPage } from './AddressManagementPage';
import { TransactionsPage } from './TransactionsPage';
import { QrPage } from './QrPage';
import { QrRequests } from './QrRequests';
import { EventsPage } from './EventsPage';
import { TemplatePage } from './templates/TemplatePage';
import { TemplateFormPage } from './templates/TemplateFormPage';
import { Checkouts } from './Checkouts';
import { Deliveries } from './Deliveries';
import { AdminLogsPage } from './AdminLogsPage';
import { DeliveriesRequests } from './DeliveriesRequests';
import { WebsitesManage } from './Websites/WebsitesManage';
import Header from '../components/Header';
import Landing from './Landing';

import Cover from '../images/scan-cover.svg';
import BackofficeFooter from './BackofficeFooter';

export const MintersPage = () => <div> This is a MintersPage </div>;

type RouteProps = {
  path: string;
  roles?: string[];
  title?: string;
};

type LabelProps = {
  roles: string[];
  title: string;
};

const Label: React.FC<{ label: LabelProps }> = ({ label }) => {
  const { title } = label;
  return <h2>{title}</h2>;
};

const SidebarLink: React.FC<{ route: RouteProps; handleClick: () => void }> = ({ route, handleClick }) => {
  const { path, title } = route;
  if (typeof route === 'object' && title) {
    return (
      <Link className={'bm-item'} to={path} onClick={handleClick}>
        {title}
      </Link>
    );
  }

  return null;
};

export const withAuthentication = <T extends Object>(WrappedComponent: React.ComponentType<T>): React.FC<T> => {
  return (props: T) => {
    const isAuthenticated = authClient.isAuthenticated();

    if (!isAuthenticated) return <Redirect to="/admin" />;

    return <WrappedComponent {...props} />;
  };
};

export const NavigationMenu = withRouter(({ history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useContext(AuthContext);

  const closeMenu = () => setIsOpen(false);

  const isAdmin = authClient.isAuthenticated();
  return (
    <Menu isOpen={isOpen} onStateChange={(state) => setIsOpen(state.isOpen)} right disableAutoFocus>
      {isAdmin && (
        <>
          <Label label={LABELS.issueBadges} />
          <SidebarLink route={ROUTES.issueForEvent} handleClick={closeMenu} />
          <SidebarLink route={ROUTES.issueForUser} handleClick={closeMenu} />
        </>
      )}

      <Label label={LABELS.manage} />

      {isAdmin && (
        <>
          <SidebarLink route={ROUTES.addressManagement} handleClick={closeMenu} />
          <SidebarLink route={ROUTES.codesRequest} handleClick={closeMenu} />
          <SidebarLink route={ROUTES.deliveries.requests} handleClick={closeMenu} />
        </>
      )}

      <SidebarLink route={ROUTES.websites.websitesManage} handleClick={closeMenu} />
      <SidebarLink route={ROUTES.events} handleClick={closeMenu} />
      <SidebarLink route={ROUTES.codes} handleClick={closeMenu} />
      <SidebarLink route={ROUTES.deliveries.admin} handleClick={closeMenu} />
      <SidebarLink route={ROUTES.template} handleClick={closeMenu} />

      <Label label={LABELS.otherTasks} />

      {isAdmin && (
        <>
          <SidebarLink route={ROUTES.transactions} handleClick={closeMenu} />
          <SidebarLink route={ROUTES.checkouts.admin} handleClick={closeMenu} />
          <SidebarLink route={ROUTES.adminLogs} handleClick={closeMenu} />
          <SidebarLink route={ROUTES.burn} handleClick={closeMenu} />
        </>
      )}

      {!isAdmin && <SidebarLink route={ROUTES.adminLogin} handleClick={closeMenu} />}

      {isAdmin && (
        <a
          className="bm-item"
          href=""
          onClick={() => {
            auth.logout();
          }}
        >
          Logout
        </a>
      )}
    </Menu>
  );
});

const IssueForEventPageWithAuthentication = withAuthentication(IssueForEventPage);
const IssueForUserPageWithAuthentication = withAuthentication(IssueForUserPage);
const TransactionsPageWithAuthentication = withAuthentication(TransactionsPage);
const QrRequestsWithAuthentication = withAuthentication(QrRequests);
const DeliveriesRequestsWithAuthentication = withAuthentication(DeliveriesRequests);
const MintersPageWithAuthentication = withAuthentication(MintersPage);
const BurnPageWithAuthentication = withAuthentication(BurnPage);
const AddressManagementPageWithAuthentication = withAuthentication(AddressManagementPage);
const CheckoutsWithAuthentication = withAuthentication(Checkouts);
const AdminLogsPageWithAuthentication = withAuthentication(AdminLogsPage);

export const BackOffice: React.FC = () => (
  <>
    <NavigationMenu />
    <Header sectionName={'Backoffice'} />
    <img src={Cover} alt="cover" className="backoffice-cover" />
    <main className="app-content backoffice">
      <div className="container">
        <Switch>
          <Route exact path={ROUTES.codes.path} render={() => <QrPage />} />

          <Route exact path={ROUTES.codesRequest.path} render={() => <QrRequestsWithAuthentication />} />

          <Route exact path={ROUTES.deliveries.requests.path} render={() => <DeliveriesRequestsWithAuthentication />} />

          <Route path={ROUTES.events.path} render={() => <EventsPage />} />

          <Route exact path={ROUTES.admin} render={() => <Landing />} />

          <Route exact path={ROUTES.template.path} component={TemplatePage} />

          <Route path={ROUTES.templateForm.path} component={TemplateFormPage} />

          <Route exact path={ROUTES.issueForEvent.path} render={() => <IssueForEventPageWithAuthentication />} />

          <Route exact path={ROUTES.issueForUser.path} render={() => <IssueForUserPageWithAuthentication />} />

          <Route exact path={ROUTES.minters.path} render={() => <MintersPageWithAuthentication />} />

          <Route exact path={ROUTES.burn.path} render={() => <BurnPageWithAuthentication />} />

          <Route exact path={ROUTES.burnToken.path} render={() => <BurnPageWithAuthentication />} />

          <Route
            exact
            path={ROUTES.addressManagement.path}
            render={() => <AddressManagementPageWithAuthentication />}
          />

          <Route exact path={ROUTES.transactions.path} render={() => <TransactionsPageWithAuthentication />} />

          <Route path={ROUTES.checkouts.admin.path} render={() => <CheckoutsWithAuthentication />} />

          <Route path={ROUTES.deliveries.admin.path} render={() => <Deliveries />} />

          <Route exact path={ROUTES.adminLogs.path} render={() => <AdminLogsPageWithAuthentication />} />

          <Route path={ROUTES.websites.websitesManage.path} render={() => <WebsitesManage />} />

          <Route path="*" render={() => <Redirect to="/admin" />} />
        </Switch>
      </div>
      <BackofficeFooter />
    </main>
  </>
);
