import React, { useEffect, useState } from 'react';

/* Helpers */
import { getTokenInfo, getTokensFor, HashClaim, TokenInfo } from '../../api';

/* Components */
import ClaimCommunityMessage from './ClaimCommunityMessage';
import ClaimFinishedTokenInfo from './ClaimFinishedTokenInfo';
import ClaimFinishedCollectorInfo from './ClaimFinishedCollectorInfo';

/*
 * @dev: Component to show minted token
 * */
const ClaimFinished: React.FC<{ claim: HashClaim }> = ({ claim }) => {
  const [token, setToken] = useState<TokenInfo | undefined>(undefined);
  const [tokens, setTokens] = useState<TokenInfo[] | null>(null);

  useEffect(() => {
    getToken().then();
    getEvents().then();
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

  const getEvents = async () => {
    try {
      let tokens = null;
      // use the user_input ( email ) if there is no beneficiary ( address ) to get collection
      const collectionAddress = claim.beneficiary ? claim.beneficiary : claim.user_input;
      if (collectionAddress) {
        tokens = await getTokensFor(collectionAddress);
      }
      setTokens(tokens);
    } catch (e) {
      console.log(e);
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
