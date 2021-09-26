import React, { useState } from 'react';
import { EventFilter } from '../../api';
import { Field, Form, Formik, FormikActions } from 'formik';
import { Loading } from '../../components/Loading';
import { OptionTypeBase } from 'react-select';
import EventSelect, { colourStyles } from 'components/EventSelect';
import CloseIcon from '../../images/x.svg';
import { authClient } from '../../auth';
import { EventField } from '../EventsPage';
import { SecretsAuthAdminSchema, SecretsAuthWithSecretCodeSchema } from '../../lib/schemas';

type EventSecretCodeForm = {
  onSubmit: (eventId: number, secretCode?: number) => void;
  loading: boolean;
  error?: string;
  askSecretCode?: boolean;
  onClose?: () => void;
};

export const EventSecretCodeForm: React.FC<EventSecretCodeForm> = ({
  error,
  loading,
  onSubmit,
  askSecretCode,
  onClose,
}) => {
  const [mode, setMode] = useState<string>('name');

  const handleAuthenticationModalSubmit = (
    values: AuthenticationModalFormikValues,
    actions: FormikActions<AuthenticationModalFormikValues>,
  ) => {
    if (askSecretCode && values.secretCode) {
      onSubmit(values.eventId || 0, parseInt(values.secretCode));
      actions.resetForm();
    } else if (!askSecretCode) {
      onSubmit(values.eventId || 0, 0);
      actions.resetForm();
    }
  };

  type AuthenticationModalFormikValues = {
    eventId?: number;
    secretCode?: string;
  };

  const filter: EventFilter = {
    expired: false,
  };

  return (
    <Formik
      initialValues={{}}
      validateOnBlur={false}
      validateOnChange={false}
      onSubmit={handleAuthenticationModalSubmit}
      validationSchema={askSecretCode ? SecretsAuthWithSecretCodeSchema : SecretsAuthAdminSchema}
    >
      {({ values, errors }) => {
        return (
          <Form className={'auth-modal-container'}>
            {loading && <Loading />}
            {!loading && (
              <>
                <button type="button" className="close" onClick={onClose}>
                  <img src={CloseIcon} alt={'close'} className="close-icon" />
                </button>
                <select
                  className={'filter-by rselect'}
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                  }}
                >
                  <option value="name">Search Event by Name</option>
                  <option value="id">Search Event by Event Id</option>
                </select>
                {mode === 'name' && (
                  <EventSelect
                    name="event"
                    filter={filter}
                    placeholder="Search Event"
                    onChange={(option?: OptionTypeBase | null) => {
                      values.eventId = option ? option.value : option;
                    }}
                    styles={{
                      ...colourStyles,
                      menuPortal: (styles: any) => ({
                        ...styles,
                        zIndex: '99999',
                      }),
                    }}
                    menuPortalTarget={document.body}
                    controlStyles={{ marginBottom: '24px' }}
                    placeholderStyles={{ color: error ? '#F76278' : undefined }}
                  />
                )}
                {mode === 'id' && (
                  <Field
                    id={'eventId'}
                    name={'eventId'}
                    values={values.eventId || ''}
                    type={'number'}
                    className={'field ' + (error ? 'modal-input-error' : '')}
                    placeholder={'Event Id'}
                    value={values.eventId}
                  />
                )}
                {errors.eventId && <div className="error">{errors.eventId}</div>}
                {askSecretCode && <EventField title="Edit Code" name="secretCode" />}
                {error && <div className="error">{error}</div>}
              </>
            )}
            <button className="filter-base filter-button" style={{ width: '100%' }} type="submit" disabled={loading}>
              {authClient.isAuthenticated() ? 'Submit' : 'Submit Authentication'}
            </button>
          </Form>
        );
      }}
    </Formik>
  );
};
