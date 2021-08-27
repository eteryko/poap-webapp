import React, { useEffect, useState } from 'react';

/* Helpers */
import { getTokenInfo, HashClaim, TokenInfo } from '../../api';

/* Components */
import ClaimCommunityMessage from './ClaimCommunityMessage';
import ClaimFinishedTokenInfo from './ClaimFinishedTokenInfo';
import ClaimFinishedCollectorInfo from './ClaimFinishedCollectorInfo';

/*
 * @dev: Component to show minted token
 * */
const ClaimFinished: React.FC<{ claim: HashClaim }> = ({ claim }) => {
  const [token, setToken] = useState<TokenInfo | undefined>(undefined);

  useEffect(() => {
    getToken().then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getToken = async () => {
    if (claim.result) {
      try {
        setToken(await getTokenInfo(claim.result.token.toString()));
      } catch (e) {
        console.log('Error on getting token info');
      }
    }
  };

  return (
    <div className={'claim-info'} data-aos="fade-up" data-aos-delay="300">
      <ClaimFinishedTokenInfo
        eventId={claim.event_id}
        order={token?.supply?.order || 0}
        claimedDateString={claim.claimed_date}
      />
      <ClaimFinishedCollectorInfo claim={claim} />
      <ClaimCommunityMessage />
    </div>
  );
};

export default ClaimFinished;
