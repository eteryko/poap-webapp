import React, { FC, useEffect, useState } from 'react';
import { useToasts } from 'react-toast-notifications';

/* Helpers */
import {
  EventSecretType,
  getEventById,
  getSecretByEventIdAndSecretCode,
  getSecrets,
  PoapEvent,
  Secret,
} from '../../api';

/* Components */
import { Loading } from '../../components/Loading';
import FilterButton from '../../components/FilterButton';
import FilterSelect from '../../components/FilterSelect';
import ReactPaginate from 'react-paginate';
import ReactModal from 'react-modal';

/* Assets */
import { ReactComponent as EditIcon } from '../../images/edit.svg';
import checked from '../../images/checked.svg';
import error from '../../images/error.svg';
import { format, parse } from 'date-fns';
import { EventSecretCodeForm } from '../Websites/EventSecretCodeForm';

/* Types */
type PaginateAction = {
  selected: number;
};

type SecretsListProps = {
  onCreateNew: (event: PoapEvent) => void;
  onEdit: (event: PoapEvent) => void;
};

const SecretList: FC<SecretsListProps> = ({ onCreateNew, onEdit }) => {
  /* State */
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [activeStatus, setActiveStatus] = useState<boolean | null>(null);
  const [timeframe, setTimeframe] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isFetching, setIsFetching] = useState<null | boolean>(null);
  const [isEventIdModalOpen, setIsEventIdModalOpen] = useState<boolean>(false);
  const [isFetchingEvent, setIsFetchingEvent] = useState<boolean>(false);
  const [eventIdModalError, setEventIdModalError] = useState<string | undefined>(undefined);

  const { addToast } = useToasts();

  useEffect(() => {
    if (secrets.length > 0) fetchSecrets().then();
  }, [page]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    setPage(0);
    fetchSecrets().then();
  }, [activeStatus, timeframe, limit]); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* Data functions */
  const fetchSecrets = async () => {
    setIsFetching(true);
    try {
      const response = await getSecrets(limit, page * limit, activeStatus, timeframe, EventSecretType.word);
      if (response) {
        setSecrets(response.items);
        setTotal(response.total);
      }
    } catch (e) {
      addToast('Error while fetching secrets', {
        appearance: 'error',
        autoDismiss: false,
      });
    } finally {
      setIsFetching(false);
    }
  };

  /* UI Handlers */
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { value } = e.target;
    setLimit(parseInt(value, 10));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { value } = e.target;
    let finalValue = value === '' ? null : value === 'true';
    setActiveStatus(finalValue);
  };

  const handleTimeframe = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { value } = e.target;
    let finalValue = value === '' ? null : value;
    setTimeframe(finalValue);
  };

  const handlePageChange = (obj: PaginateAction) => setPage(obj.selected);

  const handleEventIdModalSubmit = async (eventId: number): Promise<void> => {
    setIsFetchingEvent(true);
    setEventIdModalError(undefined);

    try {
      const event = await getEventById(eventId);

      if (event) {
        if (event.expiry_date) {
          const expirationDate = parse(event.expiry_date, 'dd-MMM-yyyy', new Date());
          if (new Date().getTime() > expirationDate.getTime()) {
            setIsFetchingEvent(false);
            setEventIdModalError('the event is expired');
            return;
          }
        }

        onCreateNew(event);
      } else {
        setIsFetchingEvent(false);
        setEventIdModalError('invalid event or secret code');
      }
    } catch (e) {
      setIsFetchingEvent(false);
      setEventIdModalError('invalid event or secret code');
    }
  };

  const handleEditOnClick = async (event_id: number): Promise<void> => {
    setIsFetching(true);
    const secret = await getSecretByEventIdAndSecretCode(event_id, EventSecretType.word);
    if (secret) {
      const event = await getEventById(secret.event_id);
      setIsFetching(false);
      if (event) {
        onEdit(event);
      }
    } else {
      setIsFetching(false);
    }
  };

  const tableHeaders = (
    <div className={'row table-header visible-md'}>
      <div className={'col-xs-3 '}>ClaimName</div>
      <div className={'col-xs-2 '}>Start Date</div>
      <div className={'col-xs-2 '}>End Date</div>
      <div className={'col-xs-3 center'}>Claim/Total</div>
      <div className={'col-xs-1 center'}>Active</div>
      <div className={'col-xs-1'} />
    </div>
  );

  return (
    <div className={'admin-table websites'}>
      {/*Modals*/}
      <ReactModal
        isOpen={isEventIdModalOpen}
        onRequestClose={() => {
          setIsEventIdModalOpen(false);
        }}
        shouldFocusAfterRender={true}
        shouldCloseOnEsc={true}
        shouldCloseOnOverlayClick={true}
        style={{ content: { overflow: 'visible' } }}
      >
        <EventSecretCodeForm
          onSubmit={handleEventIdModalSubmit}
          error={eventIdModalError}
          loading={isFetchingEvent}
          onClose={() => {
            setIsEventIdModalOpen(false);
          }}
        />
      </ReactModal>
      {/*End Modals*/}
      <h2>Secrets</h2>
      <div className="filters-container websites">
        <div className={'filter col-md-4 col-xs-12'}>
          <div className={'filter-group'}>
            <FilterSelect handleChange={handleTimeframe}>
              <option value="">Filter by Time Frame</option>
              <option value="future">Future Events</option>
              <option value="present">Present Events</option>
              <option value="past">Past Events</option>
            </FilterSelect>
          </div>
        </div>
        <div className={'filter col-md-3 col-xs-6'}>
          <div className={'filter-group'}>
            <FilterSelect handleChange={handleStatusChange}>
              <option value="">Filter by status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </FilterSelect>
          </div>
        </div>
        <div className={'col-md-2'} />
        <div className={'filter col-md-3 col-xs-6 new-button'}>
          <FilterButton
            text="Create new"
            handleClick={() => {
              setIsEventIdModalOpen(true);
            }}
          />
        </div>
      </div>
      <div className={'secondary-filters'}>
        <div className={'secondary-filters--pagination'}>
          Results per page:
          <select onChange={handleLimitChange}>
            <option value={10}>10</option>
            <option value={100}>100</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      </div>
      {isFetching && (
        <div className={'delivery-table-section'}>
          {tableHeaders}
          <Loading />
        </div>
      )}

      {secrets && secrets.length === 0 && !isFetching && <div className={'no-results'}>No Secrets found</div>}

      {secrets && secrets.length !== 0 && !isFetching && (
        <div className={'website-table-section'}>
          {tableHeaders}
          <div className={'admin-table-row website-table'}>
            {secrets.map((secret, i) => {
              return (
                <div className={`row ${i % 2 === 0 ? 'even' : 'odd'}`} key={i}>
                  <div className={'col-md-3 col-xs-12 ellipsis'}>
                    <span className={'visible-sm'}>Claim Name: </span>
                    {secret.claim_name}
                  </div>

                  <div className={'col-md-2 col-xs-12 ellipsis'}>
                    <span className={'visible-sm'}>Start Date: </span>
                    {secret.from ? format(new Date(secret.from), 'MM-dd-yyyy HH:MM') : '-'}
                  </div>

                  <div className={'col-md-2 col-xs-12 ellipsis'}>
                    <span className={'visible-sm'}>End Date: </span>
                    {secret.to ? format(new Date(secret.to), 'MM-dd-yyyy HH:MM') : '-'}
                  </div>

                  <div className={'col-md-3 col-xs-12 ellipsis center'}>
                    <span className={'visible-sm'}>Claimed / Total: </span>
                    {secret.total !== undefined && secret.claimed !== undefined
                      ? `${secret.claimed}/${secret.total}`
                      : '-'}
                  </div>

                  <div className={'col-md-1 col-xs-12 center status'}>
                    <span className={'visible-sm'}>Active: </span>
                    <img
                      src={secret.active ? checked : error}
                      alt={secret.active ? 'Active' : 'Inactive'}
                      className={'status-icon status-icon-websites'}
                    />
                  </div>

                  <div className={'col-md-1 col-xs-1 center event-edit-icon-container'}>
                    <EditIcon
                      onClick={async () => {
                        await handleEditOnClick(secret.event_id);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {total > limit && (
            <div className={'pagination'}>
              <ReactPaginate
                pageCount={Math.ceil(total / limit)}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                activeClassName={'active'}
                onPageChange={handlePageChange}
                forcePage={page}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecretList;
