import React from 'react';
import { LinkButton } from '../../components/LinkButton';
import { isValidEmail, reduceAddress } from '../../lib/helpers';
import { HashClaim } from '../../api';
import StatsImageRight from '../../images/claim_stats_misc_right.svg';
import StatsImageLeft from '../../images/claim_stats_misc_left.svg';
import ClaimFinishedStatCard from './ClaimFinishedStatCard';

const ClaimFinishedCollectorInfo: React.FC<{ claim: HashClaim }> = ({ claim }) => {
  const claimedWithEmail = !!(claim && claim.claimed && claim.user_input && isValidEmail(claim.user_input));
  const appLink = claimedWithEmail ? `/scan/${claim.user_input}` : `/scan/${claim.beneficiary}`;

  return (
    <div className="claim-collector-info-container">
      <p className="claim-collector-info-address">Hey, {reduceAddress(claim.beneficiary)} </p>
      <div className={'claim-collector-info-title'}>Keep growing your collection</div>
      <div className={'claim-collector-info-stats'}>
        <img src={StatsImageLeft} alt="" className="claim-collector-info-img-left" />
        <ClaimFinishedStatCard text="Total POAPs in your wallet" stat="64" />
        <ClaimFinishedStatCard text="New POAPs this year" stat="27" />
        <ClaimFinishedStatCard text="New POAPs this month" stat="3" />
        <img src={StatsImageRight} alt="" className="claim-collector-info-img-right" />
      </div>
      <LinkButton text={'Browse my collection'} link={appLink} />
    </div>
  );
};

export default ClaimFinishedCollectorInfo;
