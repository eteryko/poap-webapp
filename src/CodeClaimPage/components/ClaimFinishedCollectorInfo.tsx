import React, { useEffect, useMemo, useState } from 'react';
import { LinkButton } from '../../components/LinkButton';
import { isValidEmail, reduceAddress } from '../../lib/helpers';
import { getTokensFor, HashClaim, TokenInfo } from '../../api';
import StatsImageRight from '../../images/claim_stats_misc_right.svg';
import StatsImageLeft from '../../images/claim_stats_misc_left.svg';
import ClaimFinishedStatCard from './ClaimFinishedStatCard';
import ClaimCalendarIcon from '../../images/claim_finished_calendar.svg';
import ClaimWalletIcon from '../../images/claim_finished_wallet.svg';

const ClaimFinishedCollectorInfo: React.FC<{ claim: HashClaim }> = ({ claim }) => {
  const [tokens, setTokens] = useState<TokenInfo[] | undefined>(undefined);

  const sameMonth = (dateString?: string): boolean => {
    if (!dateString) {
      return false;
    }

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const date = new Date(dateString);

    return date.getFullYear() === year && date.getMonth() === month;
  };

  const sameYear = (dateString?: string): boolean => {
    if (!dateString) {
      return false;
    }

    const date = new Date(dateString);

    return date.getFullYear() === new Date().getFullYear();
  };

  const tokensThisMonth = useMemo(() => {
    return tokens ? tokens.filter((x) => sameMonth(x.created)).length : 0;
    // eslint-disable-next-line
  }, [tokens]);
  const tokensWallet = useMemo(() => {
    return tokens ? tokens.length : 0;
    // eslint-disable-next-line
  }, [tokens]);
  const tokensThisYear = useMemo(() => {
    return tokens ? tokens.filter((x) => sameYear(x.created)).length : 0;
    // eslint-disable-next-line
  }, [tokens]);

  const claimedWithEmail = !!(claim && claim.claimed && claim.user_input && isValidEmail(claim.user_input));
  const appLink = claimedWithEmail ? `/scan/${claim.user_input}` : `/scan/${claim.beneficiary}`;
  let yearString = new Date().getFullYear().toString();
  yearString = yearString.substring(0, 2) + ' ' + yearString.substring(2, 4);

  useEffect(() => {
    fetchTokens().then();
    // eslint-disable-next-line
  }, []);

  const fetchTokens = async () => {
    const address = claim.user_input ? claim.user_input : claim.beneficiary;
    const _tokens = await getTokensFor(address);
    console.log(_tokens);
    setTokens(_tokens);
  };

  return (
    <div className="claim-collector-info-container">
      <p className="claim-collector-info-address">Hey, {reduceAddress(claim.beneficiary)} </p>
      <div className={'claim-collector-info-title'}>Keep growing your collection</div>
      <div className={'claim-collector-info-stats'}>
        <img src={StatsImageLeft} alt="" className="claim-collector-info-img-left" />
        <ClaimFinishedStatCard
          text="Total POAPs in your wallet"
          stat={tokensWallet.toString()}
          icon={ClaimWalletIcon}
        />
        <ClaimFinishedStatCard text="New POAPs this year" stat={tokensThisYear.toString()} iconText={yearString} />
        <ClaimFinishedStatCard text="New POAPs this month" stat={tokensThisMonth.toString()} icon={ClaimCalendarIcon} />
        <img src={StatsImageRight} alt="" className="claim-collector-info-img-right" />
      </div>
      <LinkButton text={'Browse my collection'} link={appLink} />
    </div>
  );
};

export default ClaimFinishedCollectorInfo;
