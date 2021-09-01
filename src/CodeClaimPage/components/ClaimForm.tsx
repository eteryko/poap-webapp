import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { ErrorMessage, Field, FieldProps, Form, Formik, FormikActions } from 'formik';
import { FiCheckSquare, FiSquare, FiHelpCircle } from 'react-icons/fi';
// @ts-ignore
import { TransactionReceipt } from 'web3-core';
import { useToasts } from 'react-toast-notifications';
import { Tooltip } from 'react-lightweight-tooltip';

/* Helpers */
import { connectWallet, NETWORK } from 'poap-eth';
import { HashClaim, postClaimHash, getClaimHash, postTokenMigration, Template, TemplatePageFormValues } from 'api';
import { AddressSchema } from 'lib/schemas';

/* Components */
import { SubmitButton } from 'components/SubmitButton';
import { TxDetail } from 'components/TxDetail';

/* Lib */
import { isValidEmail } from 'lib/helpers';
// import { useImageSrc } from 'lib/hooks/useImageSrc';
import { COLORS, TX_STATUS } from 'lib/constants';

/* ABI */
import abi from 'abis/PoapDelegatedMint.json';
import { useWindowWidth } from '@react-hook/window-size';
import dayjs from 'dayjs';
import { parse } from 'date-fns';
import ClaimCommunityMessage from './ClaimCommunityMessage';
import ClaimingMessage from './ClaimingMessage';

type QRFormValues = {
  address: string;
};

const CONTRACT_ADDRESS = process.env.REACT_APP_MINT_DELEGATE_CONTRACT;

const ClaimForm: React.FC<{
  claim?: HashClaim;
  address?: string;
  template?: Template | TemplatePageFormValues;
  onSubmit: (claim: HashClaim) => void;
}> = ({ claim, address, onSubmit, template }) => {
  const [claimed, setClaimed] = useState<boolean>(false);
  const [account, setAccount] = useState<string>(address || '');
  const [migrateInProcess, setMigrateInProcess] = useState<boolean>(false);
  const [migrate, setMigrate] = useState<boolean>(false);
  const [token, setToken] = useState<number | null>(null);
  const [web3, setWeb3] = useState<any>(null);
  const [completeClaim, setCompleteClaim] = useState<HashClaim | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [txReceipt, setTxReceipt] = useState<null | TransactionReceipt>(null);

  // const mobileImageUrlRaw = claim?.event_template?.mobile_image_url ?? template?.mobile_image_url;
  // const mobileImageLink = claim?.event_template?.mobile_image_link ?? template?.mobile_image_link;
  const mainColor = claim?.event_template?.main_color ?? template?.main_color;

  // const mobileImageUrl = useImageSrc(mobileImageUrlRaw);

  const { addToast } = useToasts();
  const width = useWindowWidth();

  useEffect(() => {
    if (migrateInProcess && !token) {
      const interval = setInterval(fetchClaim, 5000);
      return () => clearInterval(interval);
    }
  }, [migrateInProcess, token]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    startMigration();
  }, [token]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    if (txHash && web3) {
      const interval = setInterval(() => {
        getReceipt();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [txHash, txReceipt]); /* eslint-disable-line react-hooks/exhaustive-deps */

  const getAddress = async () => {
    let response = await connectWallet();
    if (!response.web3) return null;
    const accounts = await response.web3.eth.getAccounts();
    if (accounts.length === 0) return null;
    const account = accounts[0];
    setAccount(account);
  };

  const startMigration = () => {
    if (token) {
      postTokenMigration(token)
        .then((result) => {
          if (result) {
            migrateToken(result.signature);
          }
        })
        .catch(showErrorMessage);
    }
  };

  const migrateToken = async (signature: string) => {
    let _web3 = web3;
    if (!_web3) {
      let response = await connectWallet();
      if (!response.web3) return null;
      _web3 = response.web3;
      if (response.networkError) {
        let message = `Wrong network, please connect to ${NETWORK}.`;
        addToast(message, {
          appearance: 'error',
          autoDismiss: false,
        });
        return null;
      }
      setWeb3(_web3);
    }

    const accounts = await _web3.eth.getAccounts();
    if (accounts.length === 0) return null;

    const account = accounts[0];

    if (!completeClaim) return;
    const { event, beneficiary } = completeClaim;

    try {
      const contract = new _web3.eth.Contract(abi, CONTRACT_ADDRESS);
      let gas = 1000000;
      try {
        gas = await contract.methods.mintToken(event.id, token, beneficiary, signature).estimateGas({ from: account });
        gas = Math.floor(gas * 1.3);
      } catch (e) {
        console.log('Error calculating gas');
      }

      contract.methods
        .mintToken(event.id, token, beneficiary, signature)
        .send({ from: account, gas: gas }, (err: any, hash: string | null) => {
          if (err) {
            console.log('Error on Mint Token: ', err);
            showErrorMessage();
          }
          if (hash) {
            setTxHash(hash);
          }
        });
    } catch (e) {
      console.log('Error submitting transaction');
      console.log(e);
      showErrorMessage();
    }
  };

  const getReceipt = async () => {
    let receipt: null | TransactionReceipt = null;
    if (web3 && txHash !== '' && !txReceipt) {
      receipt = await web3.eth.getTransactionReceipt(txHash);
      if (receipt) {
        setTimeout(() => setTxReceipt(receipt), 1000);
      }
    }

    if (!receipt || !receipt.status || (txReceipt && !txReceipt.status)) {
      setMigrateInProcess(false);
    }

    if (receipt && receipt.status && completeClaim) onSubmit(completeClaim);
  };

  const toggleCheckbox = () => setMigrate(!migrate);

  const handleFormSubmit = async (values: QRFormValues, actions: FormikActions<QRFormValues>) => {
    actions.setSubmitting(true);
    // if (claimed) {
    //   startMigration();
    //   return;
    // }
    // try {
    //   actions.setSubmitting(true);
    //   if (claim) {
    //     const newClaim = await postClaimHash(claim.qr_hash.toLowerCase(), values.address.toLowerCase(), claim.secret);
    //     setClaimed(true);
    //     if (migrate && !isValidEmail(values.address)) {
    //       setMigrateInProcess(true);
    //       setCompleteClaim(newClaim);
    //       actions.setSubmitting(false);
    //     } else {
    //       onSubmit(newClaim);
    //     }
    //   }
    // } catch (error) {
    //   actions.setStatus({
    //     ok: false,
    //     msg: `Badge couldn't be claimed: ${error.message}`,
    //   });
    //   actions.setSubmitting(false);
    // }
  };

  const fetchClaim = async () => {
    if (!claim) return;
    getClaimHash(claim.qr_hash.toLowerCase()).then((claim) => {
      setCompleteClaim(claim);
      if (claim && claim.tx_status === TX_STATUS.passed && claim.result && claim.result.token) {
        setToken(claim.result.token);
      }
    });
  };

  const showErrorMessage = () => {
    setMigrateInProcess(false);
    let message = `Error while trying to submit transaction.\nPlease try again.`;
    addToast(message, {
      appearance: 'error',
      autoDismiss: false,
    });
  };

  let CheckboxIcon = !migrate ? FiCheckSquare : FiSquare;

  const migrationText = (
    <div className={'backoffice-tooltip'}>
      All POAPs are minted in xDAI, but should you want your POAP in mainnet, un-check this checkbox so that you can
      submit the transaction to migrate the badge to mainnet. You'll need to pay for the transaction cost. Not available
      for claims with email.
    </div>
  );
  const eventDate = claim && parse(claim.event.expiry_date, 'dd-MMM-yyyy', new Date());
  if (eventDate && eventDate < new Date()) {
    return (
      <div className={'container claim-info'} data-aos="fade-up" data-aos-delay="300">
        This POAP can’t be minted because it’s been too long since the event finished
        <br />
        If you think this is a mistake, try using Chrome or Safari
      </div>
    );
  }

  const daysExpired = eventDate ? dayjs(eventDate).diff(dayjs(), 'day') : 0;
  const dateString = (date: Date) => {
    const day = parseInt(date.toLocaleDateString('en-US', { day: 'numeric' }));
    return (
      date.toLocaleDateString('en-US', { month: 'long' }) +
      ` ${day}${
        day === 1 || day === 21 || day === 31
          ? 'st'
          : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
          ? 'rd'
          : 'th'
      }, ` +
      date.toLocaleDateString('en-US', { year: 'numeric' })
    );
  };

  return (
    <div className={'container claim-info'} data-aos="fade-up" data-aos-delay="300">
      <div>
        <Formik
          enableReinitialize
          onSubmit={handleFormSubmit}
          initialValues={{ address: account }}
          isInitialValid={account !== ''}
          validationSchema={AddressSchema}
        >
          {({ isValid, isSubmitting, status }) => {
            return (
              <>
                {!isSubmitting && (
                  <Form className="claim-form">
                    <Field
                      name="address"
                      render={({ field, form }: FieldProps) => {
                        return (
                          <input
                            type="text"
                            autoComplete="off"
                            className={classNames(!!form.errors[field.name] && 'error')}
                            placeholder={
                              (width > 440 ? 'Input your ' : '') +
                              (width > 380 ? 'Ethereum' : 'Eth') +
                              ' address, ENS name or email'
                            }
                            {...field}
                            disabled={claimed}
                          />
                        );
                      }}
                    />
                    <ErrorMessage name="gasPrice" component="p" className="bk-error" />
                    {status && <p className={status.ok ? 'bk-msg-ok' : 'bk-msg-error'}>{status.msg}</p>}
                    <div
                      className={'layer-checkbox'}
                      onClick={!isSubmitting && !migrateInProcess && !claimed ? toggleCheckbox : () => {}}
                    >
                      {claim ? (
                        <>
                          <br />
                          This POAP can be minted for the next {daysExpired === 1 ? 'day' : `${daysExpired} days`}.{' '}
                          <br />
                          It will expire on {dateString(new Date(claim.event.expiry_date))} <br />
                          <br />
                        </>
                      ) : null}
                      <CheckboxIcon color={mainColor ?? COLORS.primaryColor} /> Free minting in xDAI{' '}
                      <Tooltip content={[migrationText]}>
                        <FiHelpCircle color={mainColor ?? COLORS.primaryColor} />
                      </Tooltip>
                    </div>
                    {!txHash && (
                      <>
                        <div className={'web3-browser'}>
                          <div>
                            <span onClick={getAddress}>Get my address</span>
                          </div>
                        </div>
                        <SubmitButton
                          text="Claim POAP token"
                          className="mint-button"
                          isSubmitting={isSubmitting || migrateInProcess}
                          canSubmit={isValid}
                        />
                      </>
                    )}
                  </Form>
                )}
                {isSubmitting && <ClaimingMessage />}
              </>
            );
          }}
        </Formik>
      </div>

      {txHash && <TxDetail hash={txHash} receipt={txReceipt} />}

      {txReceipt && !txReceipt.status && (
        <div className={'text-info'}>
          <p>It seems that your transaction failed. Please refresh the page</p>
        </div>
      )}
      <ClaimCommunityMessage />
    </div>
  );
};

export default ClaimForm;
