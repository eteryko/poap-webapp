import React from 'react';
import classNames from 'classnames';

import { Formik, Form, Field, FieldProps } from 'formik';

/* Schemas */
import { ClaimHashSchema } from 'lib/schemas';

/* Components */
import { SubmitButton } from 'components/SubmitButton';

import { HashClaim } from '../../api';

type HashFormValues = {
  hash: string;
};

/*
 * @dev: Form component to get the QR if code was not scanned
 * */
const QRHashForm: React.FC<{
  error: boolean;
  loading: boolean;
  checkClaim: (hash: string) => Promise<null | HashClaim>;
  qrHash: string;
}> = ({ error, loading, checkClaim, qrHash }) => {
  const handleForm = (values: HashFormValues) => {
    checkClaim(values.hash);
  };

  return (
    <div className={'container'}>
      <Formik
        enableReinitialize
        onSubmit={handleForm}
        initialValues={{ hash: qrHash }}
        validationSchema={ClaimHashSchema}
      >
        {({ dirty, isValid }) => {
          return (
            <Form className="claim-form">
              <div className={'web3-browser'}>Please complete the form below to continue</div>
              <Field
                name="hash"
                render={({ field, form }: FieldProps) => {
                  return (
                    <input
                      type="text"
                      autoComplete="off"
                      className={classNames(!!form.errors[field.name] && 'error')}
                      placeholder={'Six-digit code'}
                      {...field}
                    />
                  );
                }}
              />
              {error && <p className={'bk-msg-error'}>We couldn't find the code, please try again.</p>}
              <SubmitButton text="Continue" isSubmitting={loading} canSubmit={isValid && dirty} />
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default QRHashForm;
