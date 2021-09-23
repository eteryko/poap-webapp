import React, { FC, useEffect, useMemo, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { Form, Formik, FormikActions } from 'formik';

/* Helpers */
import { WordSchemaWithActiveRequest, WordSchemaWithoutActiveRequest } from '../../lib/schemas';
import {
  createSecret,
  EventSecretType,
  getActiveRedeemRequests,
  getEventById,
  getSecretByEventIdAndSecretCode,
  PoapEvent,
  PoapFullEvent,
  RedeemRequestType,
  Secret,
  updateSecret,
} from '../../api';

/* Components */
import { SubmitButton } from '../../components/SubmitButton';
import { EventField, QrRequestModal } from '../EventsPage';
import { Loading } from '../../components/Loading';
import DatePicker, { DatePickerDay, SetFieldValue } from '../../components/DatePicker';
import { format, isAfter, parse } from 'date-fns';
import FormFilterReactSelect from '../../components/FormFilterReactSelect';
import { timezones } from '../Checkouts/_helpers/Timezones';
import ReactModal from 'react-modal';
import { Tooltip } from 'react-lightweight-tooltip';

/* Types */
type WebsiteFormType = {
  secretWord: string;
  timezone: number;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  active: boolean;
  codesQuantity: number;
};

type WebsiteFormProps = {
  eventId: number;
  secretCode?: number;
  maybeEvent?: PoapEvent;
};

const SecretForm: FC<WebsiteFormProps> = ({ eventId, secretCode, maybeEvent }) => {
  /* State */
  const [website, _setWebsite] = useState<Secret | null>(null);
  const [activeWebsite, setActiveWebsite] = useState<boolean>(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isActiveQrRequest, setIsActiveQrRequest] = useState<boolean>(false);
  const [edit, setEdit] = useState<boolean>(false);
  const [isFetchingWebsite, setIsFetchingWebsite] = useState<boolean>(true);
  const [event, setEvent] = useState<PoapEvent | PoapFullEvent | undefined>(maybeEvent);
  const isExpiredEvent = useMemo((): boolean => {
    return !!event && isAfter(new Date(), parse(event.expiry_date, 'dd-mmm-yy', new Date()));
  }, [event]);

  const parseDate = (date: string, time: string, timezone: number): Date => {
    const timezoneString = ('00' + Math.abs(timezone)).slice(-2) + '00';
    const dateString = `${date}T${time}${timezone >= 0 ? `+${timezoneString}` : `-${timezoneString}`}`;
    return new Date(dateString);
  };

  const formatDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  const setWebsite = (website?: Secret): void => {
    if (website) {
      _setWebsite(website);
      setActiveWebsite(website.active);
      setEdit(true);
    } else {
      setEdit(false);
    }
  };

  const initialValues = useMemo(() => {
    let values: WebsiteFormType = {
      secretWord: '',
      active: true,
      start_date: '',
      start_time: '',
      timezone: 0,
      end_date: '',
      end_time: '',
      codesQuantity: 0,
    };

    if (website) {
      const tzDelta = (website.timezone * 60 + new Date().getTimezoneOffset()) * 60000;
      const from = new Date(new Date(website.from).getTime() + tzDelta);
      const to = new Date(new Date(website.to).getTime() + tzDelta);

      values = {
        secretWord: website.claim_name,
        timezone: website.timezone,
        start_date: formatDate(from),
        start_time: formatTime(from),
        end_date: formatDate(to),
        end_time: formatTime(to),
        active: website.active,
        codesQuantity: 1,
      };
    }
    return values;
  }, [website]); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* Libraries */
  const { addToast } = useToasts();

  /* Effects */
  useEffect(() => {
    setIsFetchingWebsite(true);

    if (!event) {
      fetchEvent().then();
    }

    checkActiveQrRequest(eventId).then();

    fetchSecret().then(() => {
      setIsFetchingWebsite(false);
    });
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* Data functions */
  const fetchEvent = async () => {
    try {
      const _event = await getEventById(eventId);
      if (_event) {
        setEvent(_event);
      } else {
        addToast('Error while fetching event', {
          appearance: 'error',
          autoDismiss: false,
        });
      }
    } catch (e) {
      addToast('Error while fetching event', {
        appearance: 'error',
        autoDismiss: false,
      });
    }
  };

  const fetchSecret = async () => {
    try {
      const _website = await getSecretByEventIdAndSecretCode(eventId, EventSecretType.word, secretCode);
      setWebsite(_website);
    } catch (e) {
      //do nothing
    }
  };

  const handleDayClick = (day: Date, dayToSetup: DatePickerDay, setFieldValue: SetFieldValue) => {
    setFieldValue(dayToSetup, formatDate(day));
  };

  const toggleActiveWebsite = () => setActiveWebsite(!activeWebsite);

  // Edition Loading Component
  if (edit && !website) {
    return (
      <div className={'bk-container'}>
        <h2>Edit Website</h2>
        <Loading />
      </div>
    );
  }

  //Submit form
  const onSubmit = async (submittedValues: WebsiteFormType, actions: FormikActions<WebsiteFormType>) => {
    try {
      const { secretWord, start_date, start_time, end_date, end_time, timezone, codesQuantity } = submittedValues;

      const startDateTime: Date = parseDate(start_date, start_time, timezone);
      const endDateTime: Date = parseDate(end_date, end_time, timezone);

      if (startDateTime && endDateTime && isAfter(startDateTime, endDateTime)) {
        addToast('Start date & time should be before End date & time', {
          appearance: 'error',
          autoDismiss: true,
        });
        actions.setSubmitting(false);
        return;
      }

      try {
        if (!edit) {
          await createSecret(
            eventId,
            secretWord,
            codesQuantity,
            timezone,
            EventSecretType.word,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            undefined,
            activeWebsite,
            secretCode,
          );

          const website = await getSecretByEventIdAndSecretCode(eventId, EventSecretType.word, secretCode);

          setWebsite(website);

          addToast('Secret created correctly', {
            appearance: 'success',
            autoDismiss: true,
          });
        } else {
          await updateSecret(
            eventId,
            secretWord,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            timezone,
            EventSecretType.word,
            false,
            activeWebsite,
            secretCode,
          );

          addToast('Secret updated correctly', {
            appearance: 'success',
            autoDismiss: true,
          });
        }

        actions.setSubmitting(false);
      } catch (e) {
        let _msg: React.ReactNode | string = e.message;
        addToast(_msg, {
          appearance: 'error',
          autoDismiss: false,
        });
        actions.setSubmitting(false);
      }
    } catch (err) {
      actions.setSubmitting(false);
      addToast(err.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const handleQrRequestModalRequestClose = (): void => {
    setIsQrModalOpen(false);
  };

  const handleQrRequestModalClick = (): void => {
    setIsQrModalOpen(true);
  };

  const checkActiveQrRequest = async (id: number) => {
    const active = await getActiveRedeemRequests(id, RedeemRequestType.secret_word);
    if (active.length > 0) {
      setIsActiveQrRequest(true);
    } else {
      setIsActiveQrRequest(false);
    }
  };

  return (
    <>
      {/*Modals*/}
      <ReactModal
        isOpen={isQrModalOpen}
        onRequestClose={handleQrRequestModalRequestClose}
        shouldFocusAfterRender={true}
        shouldCloseOnEsc={true}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            overflow: 'visible',
          },
        }}
      >
        <QrRequestModal
          eventId={eventId}
          secretCode={secretCode}
          type={RedeemRequestType.secret_word}
          handleModalClose={handleQrRequestModalRequestClose}
          setIsActiveQrRequest={checkActiveQrRequest}
        />
      </ReactModal>
      {/*End Modals*/}
      <div className={'bk-container'}>
        {!isFetchingWebsite && (
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={isActiveQrRequest ? WordSchemaWithActiveRequest : WordSchemaWithoutActiveRequest}
            onSubmit={onSubmit}
          >
            {({ values, errors, isSubmitting, setFieldValue }) => {
              const handleSelectChange = (name: string) => (selectedOption: any) =>
                setFieldValue(name, selectedOption.value);

              let startDateLimit =
                values.end_date !== ''
                  ? {
                      from: new Date(new Date(values.end_date).setHours(0, 0, 0, 0)),
                      to: new Date('2030-01-01'),
                    }
                  : undefined;

              let endDateLimit =
                values.start_date !== ''
                  ? {
                      from: new Date('2021-01-01'),
                      to: new Date(new Date(values.start_date).setHours(23, 59, 59, 999)),
                    }
                  : undefined;

              return (
                <Form className={'website-admin-form'}>
                  <h2>{edit ? 'Edit Secret' : 'Create Secret'} </h2>
                  <h3>General Info</h3>
                  <div>
                    <div className={'col-xs-12'}>
                      <EventField title="Secret Name" name="secretWord" />
                    </div>
                  </div>
                  <div className={'date-row'}>
                    <div className={'col-xs-12 col-md-4'}>
                      <DatePicker
                        text="Start Date"
                        dayToSetup="start_date"
                        handleDayClick={handleDayClick}
                        setFieldValue={setFieldValue}
                        placeholder={values.start_date}
                        value={values.start_date}
                        disabled={false}
                        disabledDays={startDateLimit}
                      />
                      <EventField disabled={false} title="" name="start_time" type="time" />
                    </div>
                    <div className={'col-xs-12  col-md-4'}>
                      <DatePicker
                        text="End Date"
                        dayToSetup="end_date"
                        handleDayClick={handleDayClick}
                        setFieldValue={setFieldValue}
                        placeholder={values.end_date}
                        value={values.end_date}
                        disabled={false}
                        disabledDays={endDateLimit}
                      />
                      <EventField disabled={false} title="" name="end_time" type="time" />
                    </div>
                    <div
                      className={'col-xs-12 col-md-4'}
                      style={{
                        paddingBottom: '5px',
                      }}
                    >
                      <FormFilterReactSelect
                        label="Timezone"
                        name="timezone"
                        placeholder={''}
                        onChange={handleSelectChange('timezone')}
                        options={timezones}
                        disabled={false}
                        value={timezones?.find((option) => option.value === values['timezone'])}
                      />
                    </div>
                  </div>

                  {!edit && (
                    <div className={'date-row'}>
                      <div className={'col-xs-12'}>
                        <EventField title={'Requested Codes'} name={'codesQuantity'} type={'number'} disabled={edit} />
                      </div>
                    </div>
                  )}

                  {edit && (
                    <div>
                      <div className={'col-xs-12'}>
                        <RequestMoreCodesButton
                          hasActiveQrRequest={isActiveQrRequest}
                          isExpiredEvent={isExpiredEvent}
                          onClick={handleQrRequestModalClick}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <div className={'col-xs-8'}>
                      <div className={'checkbox-field'} onClick={toggleActiveWebsite}>
                        <input type="checkbox" checked={activeWebsite} readOnly name="website" />
                        <label>Active Secret</label>
                      </div>
                    </div>
                  </div>

                  <div className={'col-md-12'}>
                    <SubmitButton text="Submit" isSubmitting={isSubmitting} canSubmit={true} />
                  </div>
                </Form>
              );
            }}
          </Formik>
        )}
        {isFetchingWebsite && <Loading />}
      </div>
    </>
  );
};

type RequestMoreCodesButtonProps = {
  hasActiveQrRequest: boolean;
  isExpiredEvent: boolean;
  onClick: () => void;
};

const RequestMoreCodesButton: FC<RequestMoreCodesButtonProps> = ({ hasActiveQrRequest, isExpiredEvent, onClick }) => {
  const tooltipMessage = (
    <div key={'1'} className={'backoffice-tooltip'}>
      {!isExpiredEvent ? (
        <>A request for this event is being processed</>
      ) : (
        <>You can't request codes on an expired event</>
      )}
    </div>
  );

  const disabled = useMemo((): boolean => {
    return hasActiveQrRequest || isExpiredEvent;
  }, [hasActiveQrRequest, isExpiredEvent]);

  return disabled ? (
    <Tooltip
      content={[tooltipMessage]}
      styles={{
        wrapper: { display: 'block' },
        tooltip: {},
        arrow: {},
        gap: {},
        content: {},
      }}
    >
      <button
        disabled={true}
        type="button"
        className={'filter-base filter-button disabled'}
        style={{
          width: '100%',
          cursor: 'not-allowed',
        }}
      >
        Request more codes
      </button>
    </Tooltip>
  ) : (
    <button type="button" className={'filter-base filter-button'} onClick={onClick} style={{ width: '100%' }}>
      Request more codes
    </button>
  );
};

export default SecretForm;
