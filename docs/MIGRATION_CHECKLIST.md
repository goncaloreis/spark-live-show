# Migration Checklist: Free → Pay-to-Track

## Phase 1: Pre-Migration ✅
- [x] Document strategy in Project Knowledge
- [x] Create documentation files in current repo
- [ ] Commit all documentation to GitHub

## Phase 2: New Repository Setup
- [ ] Create new GitHub repo: `spark-points-season2`
- [ ] Transfer codebase to new repo
- [ ] Verify all files transferred correctly

## Phase 3: New Lovable Project
- [ ] Create new Lovable project
- [ ] Connect to new GitHub repo
- [ ] Enable Lovable Cloud
- [ ] Add Project Knowledge (PROJECT_STRATEGY.md)
- [ ] Verify cloud connection active

## Phase 4: Database Setup
- [ ] Run `tracked_wallets` table migration
- [ ] Verify RLS policies are active
- [ ] Test `is_wallet_tracked()` function
- [ ] Create indexes for performance

## Phase 5: Stripe Integration
- [ ] Enable Stripe integration in Lovable
- [ ] Add Stripe Test Secret Key
- [ ] Create Stripe Product (€19.90 one-time)
- [ ] Copy Price ID (`price_...`)
- [ ] Create webhook endpoint edge function
- [ ] Configure webhook in Stripe dashboard
- [ ] Test webhook with test payment

## Phase 6: Scraper Updates
- [ ] Modify Python scraper to query `tracked_wallets`
- [ ] Update to loop through multiple wallets
- [ ] Test local scraper with test data
- [ ] Update GitHub Actions workflow
- [ ] Add environment variables to GitHub Secrets
- [ ] Test automated scraper run

## Phase 7: Frontend Implementation
- [ ] Create `PaymentCTA` component
- [ ] Create `PricingDisplay` component
- [ ] Create `PaymentSuccess` page
- [ ] Create `WalletNotTracked` empty state
- [ ] Update `Index.tsx` with tracking check
- [ ] Add countdown timer to header
- [ ] Update constants with Stripe Price ID
- [ ] Test full user flow

## Phase 8: Domain & DNS
- [ ] Configure custom domain in Lovable
- [ ] Add CNAME record to DNS
- [ ] Wait for SSL provisioning
- [ ] Verify domain loads correctly
- [ ] Test on mobile devices

## Phase 9: Testing (Test Mode)
- [ ] Complete test payment with `4242 4242 4242 4242`
- [ ] Verify wallet added to `tracked_wallets`
- [ ] Verify scraper picks up new wallet
- [ ] Verify dashboard displays correctly
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

## Phase 10: Go Live
- [ ] Switch Stripe to Live Mode
- [ ] Update Stripe Secret Key (Live)
- [ ] Update Price ID to live price
- [ ] Make small test payment with real card
- [ ] Verify end-to-end flow works
- [ ] Monitor first 24 hours closely

## Post-Launch Monitoring
- [ ] Check scraper runs hourly
- [ ] Monitor Stripe webhook logs
- [ ] Check database for new entries
- [ ] Monitor error logs
- [ ] Track conversion rate
- [ ] Gather user feedback

## Rollback Plan (If Needed)
1. Disable payment CTA in frontend
2. Make all wallets "tracked" temporarily
3. Investigate and fix issues
4. Re-enable payment flow
5. Monitor closely
