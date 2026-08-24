# Sprint 05: Auctions & Bidding API

**Prerequisite:** Read every document in `/information` before starting.

## Goal
Implement the logic for real-time auctions and bid tracking.

## Tasks
1. Build CRUD endpoints for Auctions.
2. Implement AI analysis for auction product documents to generate dynamic properties.
3. Build the bidding endpoint, ensuring the new bid is higher than the current price.
4. Prevent auction owners from bidding on their own auctions.
5. Allow both approved individuals and organizations to place bids.

## Acceptance Criteria
- [ ] Bids are validated against the current highest bid.
- [ ] Auction state (open/closed) is respected during bidding.
- [ ] Owners are explicitly blocked from self-bidding (403).
