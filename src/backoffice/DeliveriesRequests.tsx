import React, { CSSProperties, FC, HTMLAttributes, useEffect, useState } from 'react';

/* Libraries */
import ReactPaginate from 'react-paginate';
import ReactModal from 'react-modal';
import { Formik } from 'formik';
import { useToasts } from 'react-toast-notifications';

/* Components */
import { Loading } from '../components/Loading';
import FilterSelect from '../components/FilterSelect';
import { SubmitButton } from '../components/SubmitButton';
import { Column, Row, SortingRule, useExpanded, useSortBy, useTable } from 'react-table';

/* Helpers */
import {
  ExtendedDelivery,
  getDeliveries, getDeliveryAddresses, getEventById,
  PoapEvent, PoapFullEvent, rebuildDeliveries,
  SortCondition,
  SortDirection, updateDeliveryStatus,
} from '../api';
import { format } from 'date-fns';
import { timeSince } from '../lib/helpers';
import { useWindowWidth } from '@react-hook/window-size/throttled';

/* Assets */
import edit from 'images/edit.svg';
import editDisable from 'images/edit-disable.svg';
import checked from '../images/checked.svg';
import error from '../images/error.svg';
import pending from '../images/pending.svg';
import { Tooltip } from 'react-lightweight-tooltip';
import { ExpandedIcon, SortIcon } from './RequestsComponents';

type PaginateAction = {
  selected: number;
};

// creation modal types
type CreationModalProps = {
  handleModalClose: () => void;
  fetchDeliveries: () => void;
  rebuildDeliveriesPage: () => void;
  deliveryId?: number;
};

type CreationModalFormikValues = {
  approved: string
};

const DeliveriesRequests: FC = () => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [isFetchingDeliveries, setIsFetchingDeliveries] = useState<boolean>(false);
  const [approvedFilter, setApprovedFilter] = useState<string>('');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState<boolean>(false);
  const [_deliveries, setDeliveries] = useState<ExtendedDelivery[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<undefined | number>(undefined);
  const [sortCondition, setSortCondition] = useState<undefined | SortCondition>(undefined);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const width = useWindowWidth();

  useEffect(() => {
    fetchDeliveries().then();
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    fetchDeliveries().then();
  }, [page]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    setPage(0);
    fetchDeliveries().then();
  }, [approvedFilter, limit, sortCondition]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    if (isRebuilding) {
      addToast(`Rebuilding poap.delivery...`, {
        appearance: 'info',
        autoDismiss: true,
      });
    }
  }, [isRebuilding]); /* eslint-disable-line react-hooks/exhaustive-deps */

  const extendDeliveries = async (extendedDeliveries: ExtendedDelivery[]) => {
    await Promise.all(extendedDeliveries.map(async d => {
      await extendDelivery(d)
    }))
    setDeliveries(extendedDeliveries);
  }

  const extendDelivery = async (delivery: ExtendedDelivery) => {
    // extend with email data
    const main_event_id = parseInt(delivery.event_ids.split(',')[0], 10)
    if (!isNaN(main_event_id)) {
      const main_event = await getEventById(main_event_id)
      if (main_event && main_event.email && delivery.mail === '') {
        delivery.mail = main_event?.email
      }
    }

    // extend with addresses data
    const addresses = await getDeliveryAddresses(delivery.id)
    if (delivery.addresses_amount === 0) delivery.addresses_amount = addresses.length
  }

  const fetchDeliveries = async () => {
    setIsFetchingDeliveries(true);

    let event_id = undefined;
    let approved = undefined;
    if (approvedFilter) approved = approvedFilter === 'approved' ? true : approvedFilter === 'rejected' ? false : null;

    const response = await getDeliveries(limit, page * limit, event_id, approved, null, null);
    const { deliveries, total } = response;

    const extendedDeliveries: ExtendedDelivery[] = deliveries.map(d => {
      return {...d, mail: '', addresses_amount: 0}
    })
    await extendDeliveries(extendedDeliveries)

    setTotal(total);
    setIsFetchingDeliveries(false);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { value } = e.target;
    setApprovedFilter(value);
  };

  const handlePageChange = (obj: PaginateAction) => {
    setPage(obj.selected);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { value } = e.target;
    setLimit(parseInt(value, 10));
  };

  const handleCreationModalClick = (id: number): void => {
    setSelectedDeliveryId(id);
    setIsCreationModalOpen(true);
  };

  const handleCreationModalRequestClose = (): void => {
    setSelectedDeliveryId(undefined);
    setIsCreationModalOpen(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${timeSince(date)} ago`;
  };

  const handleOnSortChanged = (sortRules: SortingRule<DeliveryTableData>[]) => {
    if (!sortRules || sortRules.length < 1) return;
    const sortRule = sortRules[0];
    const sort_direction = sortRule.desc ? SortDirection.descending : SortDirection.ascending;
    const sortCondition: SortCondition = { sort_by: sortRule.id, sort_direction };
    setSortCondition(sortCondition);
  };

  const { addToast } = useToasts();
  const rebuildDeliveriesPage = async () => {
    setIsRebuilding(true)

    await rebuildDeliveries().then((_) => {
      addToast(`poap.delivery rebuilt successfully`, {
        appearance: 'success',
        autoDismiss: true,
      });
    }).catch((e) => {
      console.log(e);
      addToast('poap.delivery failed to rebuild. \n' + e.message, {
        appearance: 'error',
        autoDismiss: false,
      });
    });

    setIsRebuilding(false)
  }

  const getTableData = (): DeliveryTableData[] => {
    return _deliveries.map((delivery) => {
      const ids = delivery.event_ids.split(',').map((e) => parseInt(e, 10))
      const { id, card_title, approved, reviewed_date, reviewed_by, mail, addresses_amount, image } = delivery
      return {
        id,
        card_title,
        event_ids: ids,
        reviewed_date: approved && reviewed_date ? formatDate(new Date(reviewed_date).toDateString()) : '-',
        reviewed_by: approved && reviewed_by ? reviewed_by : '-',
        main_event_id: isNaN(ids[0]) ? -1 : ids[0],
        mail,
        addresses_amount,
        approved: approved !== undefined ? approved : null,
        image,
      };
    });
  };

  return (
    <div className={'admin-table qr'}>
      <div style={{display: 'flex'}}>
        <h2>Manage Deliveries Requests</h2>
        <SubmitButton className='small' style={{margin: '0 0 2rem auto', minWidth: 100}} canSubmit={!isRebuilding} isSubmitting={isRebuilding} text={'Rebuild'} onClick={() => {
          rebuildDeliveriesPage().then()
        }} />
      </div>
      <div className={'filters-container qr'}>
        <div className={'filter col-md-3 col-xs-6'}>
          <div className={'filter-group'}>
            <FilterSelect handleChange={handleStatusChange}>
              <option value="">Filter by Approval</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </FilterSelect>
          </div>
        </div>
        <ReactModal
          isOpen={isCreationModalOpen}
          onRequestClose={handleCreationModalRequestClose}
          shouldFocusAfterRender={true}
          shouldCloseOnEsc={true}
          shouldCloseOnOverlayClick={true}
          style={{ content: { overflow: 'visible' } }}
        >
          <CreationModal
            deliveryId={selectedDeliveryId}
            handleModalClose={handleCreationModalRequestClose}
            fetchDeliveries={fetchDeliveries}
            rebuildDeliveriesPage={rebuildDeliveriesPage}
          />
        </ReactModal>
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

      {width > 990 ? (
        <DeliveryTable
          data={getTableData()}
          loading={isFetchingDeliveries}
          onEdit={handleCreationModalClick}
          onSortChange={handleOnSortChanged}
        />
      ) : (
        <DeliveryTableMobile
          data={getTableData()}
          loading={isFetchingDeliveries}
          onEdit={handleCreationModalClick}
          onSortChange={handleOnSortChanged}
        />
      )}

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

      {_deliveries && _deliveries.length === 0 && !isFetchingDeliveries && (
        <div className={'no-results'}>No Deliveries found</div>
      )}
    </div>
  );
};

const CreationModal: React.FC<CreationModalProps> = ({ handleModalClose, deliveryId, fetchDeliveries, rebuildDeliveriesPage }) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { addToast } = useToasts();

  const handleCreationModalSubmit = async (values: CreationModalFormikValues) => {
    setIsSubmitting(true);
    const { approved } = values;
    if (deliveryId && (approved === 'approved' || approved === 'rejected')) {
      await updateDeliveryStatus(deliveryId, approved === 'approved')
        .then((_) => {
          setIsSubmitting(false);
          addToast(`Delivery ${approved === null ? 'set as pending' : approved === 'approved' ? 'approved' : 'rejected'} correctly`, {
            appearance: 'success',
            autoDismiss: true,
          });
          fetchDeliveries();
          handleModalClose();
          rebuildDeliveriesPage();
        })
        .catch((e) => {
          console.log(e);
          addToast(e.message, {
            appearance: 'error',
            autoDismiss: false,
          });
        });
    }
    setIsSubmitting(false);
  };

  const handleCreationModalClosing = () => handleModalClose();

  return (
    <Formik
      initialValues={{
        approved: ''
      }}
      validateOnBlur={false}
      validateOnChange={false}
      onSubmit={handleCreationModalSubmit}
    >
      {({ handleSubmit, setFieldValue }) => {
        return (
          <div className={'update-modal-container authentication_modal_container'}>
            <div className={'modal-top-bar'}>
              <h3>Delivery Create</h3>
            </div>
            <div className="select-container">
              <div className="bk-form-row">
                <h4>Approve</h4>
                <div className={'filter-group'}>
                  <FilterSelect handleChange={(e) => setFieldValue('approved', e.target.value)}>
                    <option value="">Set status</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </FilterSelect>
                </div>
              </div>
            </div>
            <div className="modal-content">
              <div className="modal-buttons-container creation-modal">
                <SubmitButton
                  text="Cancel"
                  isSubmitting={false}
                  canSubmit={true}
                  onClick={handleCreationModalClosing} />
                <SubmitButton
                  text="Accept"
                  isSubmitting={isSubmitting}
                  canSubmit={true}
                  onClick={handleSubmit} />
              </div>
            </div>
          </div>
        );
      }}
    </Formik>
  );
};

type EditButtonProps = {
  id: number;
  approved: boolean|null;
  onClick: (id: number) => void;
  style?: CSSProperties;
};

const EditButton: React.FC<EditButtonProps> = ({ id, approved, onClick, style }) => {
  return approved === null ? (
    <img src={edit} alt={'Edit'} className={'icon'} onClick={() => onClick(id)} style={style} />
  ) : (
    <img src={editDisable} alt={'Edit'} className={'icon'} style={style} />
  );
};

type ApprovedIconProps = {
  approved: boolean|null;
};

const ApprovedIcon: React.FC<ApprovedIconProps> = ({ approved }) => {
  return <Tooltip styles={{content: {position: 'absolute', top: 20, marginLeft: -35}, tooltip: {}, arrow: {display: 'none'}, wrapper: {}, gap: {}}} content={approved === null || approved === undefined ? 'Pending' : approved ? 'Approved' : 'Rejected'}><img src={approved === null || approved === undefined ? pending : approved ? checked : error} alt={approved === null || approved === undefined ? 'Delivery Pending' : approved ? `Delivery Reviewed` : 'Delivery not Reviewed'} className={'icon'} style={{cursor: 'default'}} /></Tooltip>;
};

const ApprovedIconMobile: React.FC<ApprovedIconProps> = ({ approved }) => {
  return <Tooltip styles={{content: {position: 'absolute', top: 20, right: 0}, tooltip: {}, arrow: {display: 'none'}, wrapper: {}, gap: {}}} content={approved === null || approved === undefined ? 'Pending' : approved ? 'Approved' : 'Rejected'}><img src={approved === null || approved === undefined ? pending : approved ? checked : error} alt={approved === null || approved === undefined ? 'Delivery Pending' : approved ? `Delivery Reviewed` : 'Delivery not Reviewed'} className={'icon'} style={{cursor: 'default'}} /></Tooltip>;
};

interface DeliveryTableData {
  id: number;
  card_title: string;
  reviewed_by: string;
  reviewed_date: string;
  event_ids: number[];
  main_event_id: number;
  mail: string;
  addresses_amount: number;
  approved: boolean|null;
  image: string;
}

type DeliveryTableProps = {
  data: DeliveryTableData[];
  loading: boolean;
  onEdit: (id: number) => void;
  onSortChange: (rules: Array<SortingRule<DeliveryTableData>>) => void;
};

const DeliveryTable: React.FC<DeliveryTableProps> = ({ data, onEdit, onSortChange, loading }) => {
  const columns = React.useMemo<Column<DeliveryTableData>[]>(
    () => [
      {
        id: 'expander',
        accessor: 'approved',
        Cell: ({ row }) => (
          <span {...row.getToggleRowExpandedProps()}>
            <ExpandedIcon isExpanded={row.isExpanded} />
          </span>
        ),
        disableSortBy: true,
      },
      { Header: 'Delivery ID', accessor: 'id', disableSortBy: true,
        Cell: ({ value }) => <div className={'center'}>{value}</div>,
      },
      { Header: 'Event ID', accessor: 'main_event_id', disableSortBy: true,
        Cell: ({ value }) => <div className={'center'}>{value}</div>,
      },
      {
        id: 'card_title',
        Header: 'Title',
        accessor: 'card_title',
        Cell: ({ value }) => <div className={'center ellipsis'} style={{maxWidth: 'none'}}>{value}</div>,
      },
      { Header: 'Mail', accessor: 'mail', disableSortBy: true,
        Cell: ({ value }) => <div className={'center'} style={{maxWidth: 'none'}}>{!value || value === '' ? '-' : value}</div>,
      },
      { Header: 'Addresses amount', accessor: 'addresses_amount', disableSortBy: true,
        Cell: ({ value }) => <div className={'center'}>{value}</div>,
      },
      {
        Header: 'Status',
        accessor: 'approved',
        Cell: ({ value }) => (
          <div className={'center'}>
            <ApprovedIcon approved={value} />
          </div>
        ),
        disableSortBy: true,
      },
      {
        id: 'edit',
        accessor: 'approved',
        Cell: (props) => (
          <EditButton id={props.row.original.id} approved={props.row.original.approved} onClick={onEdit} />
        ),
        disableSortBy: true,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
    state: { sortBy },
  } = useTable<DeliveryTableData>(
    {
      data,
      columns,
      manualSortBy: true,
    },
    useSortBy,
    useExpanded,
  );

  useEffect(() => {
    onSortChange(sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const RowContent: React.FC<{row: Row<DeliveryTableData>}> = ({row}) => {
    const RowDiv: React.FC<{style?: HTMLAttributes<any>['style']}> = ({children, style}) => {
      return <div className='delivery-request-row-div no-max-width' style={style}>{children}</div>
    }
    return (<>
      <RowDiv>
        <img src={row.original.image} style={{ maxWidth: '100px', paddingBottom: '10px' }} alt={'Delivery'} />
        <div className='no-max-width'>Reviewed date: {row.original.reviewed_date}</div>
        <div className='no-max-width'>Reviewed by: {row.original.reviewed_by}</div>
      </RowDiv>
      <RowDiv style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        border: '3px solid lightgrey',
        padding: 15
      }}>{
        row.original.event_ids.map((id, i) => (
          <div className='no-max-width' key={i + 'subcomponentDiv' + id}>
            <EventSubComponent key={i + 'subcomponent' + id} eventId={id} />
            {i !== row.original.event_ids.length-1 && <hr key={i + 'subcomponentHr' + id}/>}
          </div>
        ))
      }</RowDiv>
    </>)
  }

  return (
    <table className={'backoffice-table fluid'} {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup, i) => (
          <tr key={i} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, columnIndex) => {
              const style = columnIndex===5 ? {width: '160px'}
                : columnIndex===1||columnIndex===2 ? {width: '100px'}
                : columnIndex===0 ? {width: '30px'} : {}
              return (
                <th key={columnIndex} {...column.getHeaderProps([column.getSortByToggleProps()])} style={style}>
                  {column.render('Header')}
                  {column.isSorted ? <SortIcon isSortedDesc={column.isSortedDesc} /> : null}
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {!loading &&
          rows.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={i + 'fragment'}>
                <tr key={i + 'row'} {...row.getRowProps()}>
                  {row.cells.map((cell, j) => {
                    return (
                      <td key={j} {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
                {row.isExpanded ? (
                  <tr key={i + 'expanded'}>
                    <td className={'subcomponent'} key={i + 'subcomponent'} colSpan={visibleColumns.length}>
                      <RowContent row={row} />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        {loading && (
          <tr>
            <td colSpan={8}>
              <Loading />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

type EventSubComponentProps = {
  eventId: number;
};

const EventSubComponent: React.FC<EventSubComponentProps> = ({ eventId }) => {
  const dateFormatter = (dateString: string) => format(new Date(dateString), 'dd-MMM-yyyy');
  const [event, setEvent] = useState<PoapEvent|PoapFullEvent|null>(null)

  useEffect(() => {
    async function getEvent() {
      const event = await getEventById(eventId)
      if (event) setEvent(event)
    }
    getEvent().then()
  }, [eventId])

  const Line: React.FC = ({ children }) => {
    return (
      <div style={{width: '70%'}} className='no-max-width'>{children}</div>
    )
  }

  return (
    event ?
    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', flexDirection: 'column' }} className={'subcomponent no-max-width'}>
      <h4 style={{ fontWeight: 500 }}>
        {`from ${dateFormatter(event.start_date)} to ${dateFormatter(event.end_date)}. Expires ${dateFormatter(event.expiry_date)}`}
      </h4>
      <Line>Id: <a href={`https://poap.gallery/event/${event.id}`} style={{display: 'inline-flex'}} rel="noopener noreferrer" target="_blank">{event.id}</a></Line>
      <Line>Email: {!event.email || event.email === '' ? 'No registered email' : event.email}</Line>
    </div> : null
  );
};

const DeliveryTableMobile: React.FC<DeliveryTableProps> = ({ data, onEdit, loading }) => {
  return loading ? (
    <Loading />
  ) : (
    <table className={'backoffice-table fluid'}>
      <tbody>
        {data.map((delivery, i) => (
          <tr key={i}>
            <td className={'wrap'}>
              <div>
                <b>Id:</b> {delivery.id}
                <EditButton id={delivery.id} approved={delivery.approved} onClick={onEdit} style={{ float: 'right' }} />
              </div>
              <div>
                <b>Title:</b> {delivery.card_title}
              </div>
              <div style={{display: 'flex', alignItems: 'flex-end'}}>
                <b>Status: </b> <ApprovedIconMobile approved={delivery.approved} />
              </div>
              <div>
                <b>Email: </b> {!delivery.mail || delivery.mail === '' ? 'No registered email' : delivery.mail}
              </div>
              <div>
                <b>Addresses amount: </b> {delivery.addresses_amount}
              </div>
              {delivery.approved ? (
                <>
                  <div>
                    <b>Reviewed by: </b> {delivery.reviewed_by}
                  </div>
                  <div>
                    <b>Reviewed date: </b> {delivery.reviewed_date}
                  </div>
                </>
              ) : null}
              <img src={delivery.image} style={{ maxWidth: '100px', paddingBottom: '10px' }} alt={'Delivery'} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(1, 1fr)',
                border: '3px solid lightgrey',
                padding: 15
              }}>{
                delivery.event_ids.map((id, i) => (
                  <div key={i + 'subcomponentDiv' + id}>
                    <EventSubComponent key={i + 'subcomponent' + id} eventId={id} />
                    {i !== delivery.event_ids.length-1 && <hr key={i + 'subcomponentHr' + id}/>}
                  </div>
                ))
              }</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export { DeliveriesRequests };
