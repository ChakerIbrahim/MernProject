import api from './api';

export const getMyTenders = (userId) =>
  api.get(`/api/tenders?ownerId=${userId}`);

export const getMyAuctions = () =>
  api.get('/api/users/me/created-auctions');

export const getMyProposals = () =>
  api.get('/api/users/me/proposals');
