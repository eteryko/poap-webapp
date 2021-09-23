import React, { FC, useEffect, useState } from 'react';
import { getEventById, getEvents, PoapEvent, validateEventAndSecretCode } from '../../api';
import { authClient } from '../../auth';
import ReactModal from 'react-modal';
import SecretForm from './SecretForm';
import SecretList from './SecretList';
import { EventSecretCodeForm } from './EventSecretCodeForm';
import { parse } from 'date-fns';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../../lib/constants';

const SecretsManage: FC = () => {
  const [isAuthenticationModalOpen, setIsAuthenticationModalOpen] = useState<boolean>(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | undefined>(undefined);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [event, setEvent] = useState<PoapEvent | undefined>(undefined);
  const [secretCode, setSecretCode] = useState<number | undefined>(undefined);
  const [events, setEvents] = useState<PoapEvent[]>([]);
  const history = useHistory();

  const isAdmin = authClient.isAuthenticated();

  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticationModalOpen(false);
    } else {
      fetchEvents().then();
    }
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  const fetchEvents = async (): Promise<void> => {
    setIsLoadingAuth(true);
    const _events = await getEvents(false);
    setEvents(_events);
    setIsLoadingAuth(false);
  };

  const handleAuthenticationSubmit = async (eventId: number, secretCode?: number): Promise<void> => {
    setIsLoadingAuth(true);

    if (!secretCode) {
      setAuthError('please enter a valid edit code');
      setIsLoadingAuth(false);
      return;
    }

    try {
      const isValid = await validateEventAndSecretCode(eventId, secretCode);

      if (isValid) {
        const event = await getEventById(eventId);

        if (event) {
          if (event.expiry_date) {
            const expirationDate = parse(event.expiry_date, 'dd-MMM-yyyy', new Date());
            if (new Date().getTime() > expirationDate.getTime()) {
              setAuthError('the event is expired');
              setIsLoadingAuth(false);
              return;
            }
          }

          setEvent(event);
        }

        setIsAuthenticationModalOpen(false);
        setSecretCode(secretCode);
        setEventId(eventId);
      } else {
        setAuthError('event or edit code is invalid');
        setIsLoadingAuth(false);
      }
    } catch (e) {
      setAuthError('event or edit code is invalid');
      setIsLoadingAuth(false);
    }
  };

  const handleWebsitesListCreateNewOrEdit = (event: PoapEvent): void => {
    setEvent(event);
    setEventId(event.id);
  };

  return (
    <div className={'admin-table'}>
      {/*Modals*/}
      <ReactModal
        isOpen={isAuthenticationModalOpen}
        shouldFocusAfterRender={true}
        shouldCloseOnEsc={false}
        shouldCloseOnOverlayClick={false}
      >
        <EventSecretCodeForm
          error={authError}
          onSubmit={handleAuthenticationSubmit}
          loading={isLoadingAuth}
          events={events}
          askSecretCode={true}
          onClose={() => {
            history.push(ROUTES.admin);
          }}
        />
      </ReactModal>
      {/*End Modals*/}
      {isAdmin && !eventId && (
        <SecretList onCreateNew={handleWebsitesListCreateNewOrEdit} onEdit={handleWebsitesListCreateNewOrEdit} />
      )}
      {eventId && <SecretForm eventId={eventId} secretCode={secretCode} maybeEvent={event} />}
    </div>
  );
};

export { SecretsManage };
