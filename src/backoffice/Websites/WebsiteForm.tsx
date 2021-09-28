import React, { FC, useEffect, useMemo, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { Form, Formik, FormikActions } from 'formik';
import QRCode from 'qrcode.react';
import PoapQrLogo from '../../images/poap_qr.png';

/* Helpers */
import { WebsiteSchemaWithActiveRequest, WebsiteSchemaWithoutActiveRequest } from '../../lib/schemas';
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
import ReactModal from 'react-modal';
import { Tooltip } from 'react-lightweight-tooltip';
import { Button } from '../../components/Button';

/* Types */
type WebsiteFormType = {
  claimName: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  captcha: boolean;
  active: boolean;
  codesQuantity: number;
};

type WebsiteFormProps = {
  eventId: number;
  secretCode?: number;
  maybeEvent?: PoapEvent;
};

const WebsiteForm: FC<WebsiteFormProps> = ({ eventId, secretCode, maybeEvent }) => {
  /* State */
  const [website, _setWebsite] = useState<Secret | null>(null);
  const [activeWebsite, setActiveWebsite] = useState<boolean>(true);
  const [activeCaptcha, setActiveCaptcha] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isQrGeneratorModalOpen, setIsQrGeneratorModalOpen] = useState<boolean>(false);
  const [isActiveQrRequest, setIsActiveQrRequest] = useState<boolean>(false);
  const [edit, setEdit] = useState<boolean>(false);
  const [isFetchingWebsite, setIsFetchingWebsite] = useState<boolean>(true);
  const [event, setEvent] = useState<PoapEvent | PoapFullEvent | undefined>(maybeEvent);
  const isExpiredEvent = useMemo((): boolean => {
    return !!event && isAfter(new Date(), parse(event.expiry_date, 'dd-mmm-yy', new Date()));
  }, [event]);

  const DAY = 24 * 60 * 60 * 1000;

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
      setActiveCaptcha(website.captcha);
      setEdit(true);
    } else {
      setEdit(false);
    }
  };

  const initialValues = useMemo(() => {
    let values: WebsiteFormType = {
      claimName: '',
      active: true,
      captcha: false,
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      codesQuantity: 0,
    };

    if (website) {
      const tzDelta = new Date().getTimezoneOffset() * 60000;
      const from = new Date(new Date(website.from).getTime() + tzDelta);
      const to = new Date(new Date(website.to).getTime() + tzDelta);

      values = {
        claimName: website.claim_name,
        start_date: formatDate(from),
        start_time: formatTime(from),
        end_date: formatDate(to),
        end_time: formatTime(to),
        active: website.active,
        captcha: website.captcha,
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
    if (!maybeEvent) {
      fetchEvent().then();
    }

    checkActiveQrRequest(eventId).then();

    fetchWebsite().then(() => {
      setIsFetchingWebsite(false);
    });
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* Data functions */
  const fetchEvent = async () => {
    try {
      const _event = await getEventById(eventId);
      if (_event) {
        setEvent(event);
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

  const fetchWebsite = async () => {
    try {
      const _website = await getSecretByEventIdAndSecretCode(eventId, EventSecretType.website, secretCode);
      setWebsite(_website);
    } catch (e) {
      //do nothing
    }
  };

  const handleDayClick = (day: Date, dayToSetup: DatePickerDay, setFieldValue: SetFieldValue) => {
    setFieldValue(dayToSetup, formatDate(day));
  };

  const toggleActiveWebsite = () => setActiveWebsite(!activeWebsite);
  const toggleActiveCaptcha = () => setActiveCaptcha(!activeCaptcha);

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
      const { claimName, start_date, start_time, end_date, end_time, codesQuantity } = submittedValues;

      const timezoneOffset = new Date().getTimezoneOffset() * 60000;
      const start = parse(`${start_date} ${start_time}`, 'yyyy-MM-dd HH:mm', new Date()).getTime() - timezoneOffset;
      const startDateTime: Date = new Date(start);
      const end = parse(`${end_date} ${end_time}`, 'yyyy-MM-dd HH:mm', new Date()).getTime() - timezoneOffset;
      const endDateTime: Date = new Date(end);

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
            claimName,
            codesQuantity,
            EventSecretType.website,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            activeCaptcha,
            activeWebsite,
            secretCode,
          );

          const website = await getSecretByEventIdAndSecretCode(eventId, EventSecretType.website, secretCode);

          setWebsite(website);

          addToast('Website created correctly', {
            appearance: 'success',
            autoDismiss: true,
          });
        } else {
          await updateSecret(
            eventId,
            claimName,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            EventSecretType.website,
            activeCaptcha,
            activeWebsite,
            secretCode,
          );

          addToast('Website updated correctly', {
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

  const downloadQR = () => {
    const canvas = document.getElementById('qrCodeCanvasID') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    const pngName = website ? website.claim_name : 'qrCode';
    downloadLink.download = `${pngName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleQrRequestModalRequestClose = (): void => {
    setIsQrModalOpen(false);
  };

  const handleQrRequestModalClick = (): void => {
    setIsQrModalOpen(true);
  };

  const checkActiveQrRequest = async (id: number) => {
    const active = await getActiveRedeemRequests(id, RedeemRequestType.secret_website);
    if (active.length > 0) {
      setIsActiveQrRequest(true);
    } else {
      setIsActiveQrRequest(false);
    }
  };

  const getWebsiteUrl = (): string => {
    if (!website) return '';
    return `${process.env.REACT_APP_WEBSITES_URL}/${website.claim_name}`;
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
        style={{ content: { overflow: 'visible' } }}
      >
        <QrRequestModal
          eventId={eventId}
          secretCode={secretCode}
          type={RedeemRequestType.secret_website}
          handleModalClose={handleQrRequestModalRequestClose}
          setIsActiveQrRequest={checkActiveQrRequest}
        />
      </ReactModal>
      <ReactModal
        isOpen={isQrGeneratorModalOpen}
        onRequestClose={() => setIsQrGeneratorModalOpen(false)}
        shouldFocusAfterRender={true}
        shouldCloseOnEsc={true}
        shouldCloseOnOverlayClick={true}
      >
        <div className={'row'}>
          <div className={'col-md-12'} style={{ textAlign: 'center' }}>
            <QRCode
              id="qrCodeCanvasID"
              value={getWebsiteUrl()}
              size={320}
              includeMargin={true}
              level="H"
              imageSettings={{
                src: PoapQrLogo,
                width: 80,
                height: 80,
              }}
            />
          </div>
          <div className={'col-md-12'} style={{ textAlign: 'center' }}>
            <Button action={downloadQR} text="Download QR" extraClass="" />
          </div>
        </div>
      </ReactModal>
      {/*End Modals*/}
      <div className={'bk-container'}>
        {!isFetchingWebsite && (
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={isActiveQrRequest ? WebsiteSchemaWithActiveRequest : WebsiteSchemaWithoutActiveRequest}
            onSubmit={onSubmit}
          >
            {({ values, errors, isSubmitting, setFieldValue }) => {
              let startDateLimit =
                values.end_date !== ''
                  ? {
                      from: new Date(new Date(values.end_date + 'T00:00:00').getTime() + DAY),
                      to: new Date('2030-01-01'),
                    }
                  : undefined;

              let endDateLimit =
                values.start_date !== ''
                  ? {
                      from: new Date('2021-01-01'),
                      to: new Date(new Date(values.start_date + 'T00:00:00').getTime() - DAY),
                    }
                  : undefined;

              return (
                <Form className={'website-admin-form'}>
                  <h2>{edit ? 'Edit Website' : 'Create Website'} </h2>
                  <h3>General Info</h3>
                  <div>
                    <div className={'col-xs-12'}>
                      <EventField title="Website Name" name="claimName" />
                    </div>
                  </div>
                  <div className={'row'}>
                    <div className={'col-xs-12 col-md-6'}>
                      <div className="datetime-container">
                        <DatePicker
                          text="Start Date (UTC)"
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
                    </div>
                    <div className={'col-xs-12  col-md-6'}>
                      <div className="datetime-container">
                        <DatePicker
                          text="End Date (UTC)"
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
                      <div className={'col-md-8 col-sm-12'}>
                        <RequestMoreCodesButton
                          hasActiveQrRequest={isActiveQrRequest}
                          isExpiredEvent={isExpiredEvent}
                          onClick={handleQrRequestModalClick}
                        />
                      </div>
                      <div className={'col-md-4 col-sm-12'}>
                        <button
                          type="button"
                          className={'filter-base filter-button'}
                          onClick={() => setIsQrGeneratorModalOpen(true)}
                          style={{ width: '100%' }}
                        >
                          Generate QR
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className={'col-xs-8'}>
                      <div className={'checkbox-field'} onClick={toggleActiveWebsite}>
                        <input type="checkbox" checked={activeWebsite} readOnly name="website" />
                        <label>Active Website</label>
                      </div>
                    </div>

                    <div className={'col-xs-4'}>
                      <div className={'checkbox-field'} onClick={toggleActiveCaptcha}>
                        <input type="checkbox" checked={activeCaptcha} readOnly name="captcha" />
                        <label>Captcha Activated</label>
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

export default WebsiteForm;
