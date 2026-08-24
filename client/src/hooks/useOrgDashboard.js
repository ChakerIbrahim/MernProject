import { useState, useEffect } from 'react';
import { getMyTenders, getMyAuctions, getMyProposals } from '../functions/organizationApi';

export function useOrgDashboard(user) {
  const [tenders, setTenders] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [proposals, setProposals] = useState([]);

  const [isLoadingTenders, setIsLoadingTenders] = useState(true);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);

  const [tenderError, setTenderError] = useState('');
  const [auctionError, setAuctionError] = useState('');
  const [proposalError, setProposalError] = useState('');

  const fetchMyTenders = async () => {
    setIsLoadingTenders(true);
    setTenderError('');
    try {
      const response = await getMyTenders(user.id);
      setTenders(response.data.tenders || []);
    } catch (err) {
      setTenderError(err.response?.data?.error || 'تعذّر تحميل عطاءاتك. حاول مرة أخرى.');
    } finally {
      setIsLoadingTenders(false);
    }
  };

  const fetchMyAuctions = async () => {
    setIsLoadingAuctions(true);
    setAuctionError('');
    try {
      const response = await getMyAuctions();
      setAuctions(response.data.auctions || []);
    } catch (err) {
      setAuctionError(err.response?.data?.error || 'تعذّر تحميل مزاداتك. حاول مرة أخرى.');
    } finally {
      setIsLoadingAuctions(false);
    }
  };

  const fetchMyProposals = async () => {
    setIsLoadingProposals(true);
    setProposalError('');
    try {
      const response = await getMyProposals();
      setProposals(response.data.proposals || []);
    } catch (err) {
      setProposalError(err.response?.data?.error || 'تعذّر تحميل عروضك المقدّمة. حاول مرة أخرى.');
    } finally {
      setIsLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (user?.status === 'approved') {
      fetchMyTenders();
      fetchMyAuctions();
      fetchMyProposals();
    }
  }, [user]);

  return {
    tenders,
    auctions,
    proposals,
    isLoadingTenders,
    isLoadingAuctions,
    isLoadingProposals,
    isDashboardLoading: isLoadingTenders || isLoadingAuctions || isLoadingProposals,
    tenderError,
    auctionError,
    proposalError,
    fetchMyTenders,
    fetchMyAuctions,
    fetchMyProposals
  };
}
