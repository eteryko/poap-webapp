import React, { useEffect } from 'react';

/* Helpers */
import { HashClaim } from '../../api';
import { blockscoutLinks, TX_STATUS } from '../../lib/constants';

/* Components */
import { LinkButton } from 'components/LinkButton';

/* Assets */
import ClaimingMessage from './ClaimingMessage';

/*
 * @dev: Component to show user that transactions is being mined
 * */
const ClaimPending: React.FC<{ claim: HashClaim; checkClaim: (hash: string) => Promise<null | HashClaim> }> = ({
  claim,
  checkClaim,
}) => {
  const checkLoop = async () => {
    const result = await checkClaim(claim.qr_hash);
    if (!result || result.tx_status === '' || result.tx_status === TX_STATUS.pending) {
      setTimeout(checkLoop, 5000);
    }
  };
  useEffect(() => {
    checkLoop();
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <div className={'claim-info'} data-aos="fade-up" data-aos-delay="300">
      <ClaimingMessage />
      {claim.tx_hash && (
        <>
          <div className={'text-info'} style={{ marginTop: 72, marginBottom: 25 }}>
            Please wait a few seconds, or follow the transaction on the block explorer:
          </div>
          <LinkButton text={'View Transaction'} link={blockscoutLinks.tx(claim.tx_hash)} target={'_blank'} />
        </>
      )}
    </div>
  );
};

export default ClaimPending;
