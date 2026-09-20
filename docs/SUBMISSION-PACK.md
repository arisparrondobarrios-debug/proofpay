# ProofPay submission pack for Arbitrum Open House Singapore

## One-line description

ProofPay turns a canonical USDG or USDC transfer into a portable work-payment receipt and lets the user anchor a privacy-conscious digest on Arbitrum without publishing invoice text or personal metadata.

## Problem

Freelancers, grant teams and crypto-native operators often have a transaction hash but no consistent, machine-readable evidence that ties the public transfer facts to a durable receipt format. Screenshots are weak evidence, wallet connections add avoidable risk, and putting full invoice details onchain creates a privacy problem.

## Product flow

1. Paste a public transaction hash and select the source chain.
2. ProofPay reads the public receipt and matches only a transfer emitted by the configured canonical stablecoin contract.
3. The app produces a `proofpay.receipt.v1` JSON record.
4. The anchor module removes optional references and other metadata, canonicalizes only public transfer facts, and calculates a SHA-256 digest.
5. A user may choose to anchor that digest in `ProofPayReceiptRegistry` on Arbitrum. This optional step requires a wallet signature; read-only verification does not.
6. Any reviewer can retrieve the anchor and compare the digest to the supplied receipt file.

## Why Arbitrum

The registry is small, dependency-free and intended for low-cost receipt commitments. Arbitrum is also a direct settlement network for canonical Paxos USDG, which the Buildathon explicitly gives extra consideration to. The initial contract stays token-agnostic while the client verifies the official token address before producing a receipt.

Official USDG mainnet address on Arbitrum One, for production verification only:

`0x004B506865409877C9fA29bfb1ebA929984B9bbC`

Never use a mainnet address or asset for Buildathon testing. A human must confirm the correct test configuration from official documentation before deployment.

## What is original in this P053 package

- Receipt commitment schema `proofpay.anchor.v1`.
- Deterministic SHA-256 hashing and mutation detection.
- Dependency-free `ProofPayReceiptRegistry` with replay protection and validation.
- Explicit privacy boundary between public transfer facts and offchain invoice metadata.
- USDG-specific positioning grounded in the official Paxos deployment record.

The read-only ProofPay transaction parser and user interface existed before this package in P052 and must be disclosed as pre-existing work. The Buildathon page allows an existing project or a new build, but the entrant must confirm the official terms and clearly separate pre-existing and in-window work.

## Demo script

1. Show the safe offline ProofPay demo and explain that it does not prove a real payment.
2. Run the receipt-core tests and display the deterministic digest.
3. Change one atomic unit and show that the digest changes.
4. Review the Solidity event and replay-protection error.
5. After owner-authorized testnet deployment only, verify a public test transfer, anchor the digest, and show the transaction in an Arbitrum Sepolia explorer.

## Judging alignment

- Smart contract quality: no external dependencies, narrow state surface, custom errors, replay protection and explicit validation.
- Product-market fit: receipt evidence for freelancers, grant milestones and contractor operations paid in stablecoins.
- Innovation: separates read-only transfer verification from an optional privacy-conscious onchain commitment.
- Real problem solving: makes “reward promised” and “payment actually observed” distinguishable without custody.
- USDG: uses the official Arbitrum USDG deployment as a supported canonical asset.

## Human gate

Deadline from the live official event page: registration closes `2026-10-02 17:01`; submissions close `2026-10-04 15:59` (the page does not label a timezone in the extracted text, so confirm it in the logged-in interface).

Minimum owner actions:

1. Sign in or create the HackQuest account personally and accept the event terms.
2. Confirm eligibility, legal identity/team details and the treatment of pre-existing work.
3. Review and authorize a public repository under the owner's truthful identity.
4. Use an authorized test wallet to deploy on Arbitrum Sepolia and create the demo transaction; use faucet assets only and do not spend mainnet funds.
5. Provide the submission links and any required project/team information.
6. If selected, review the milestone agreement and provide only a public payout address. Complete KYC or other due diligence only if the official terms require it; the accessible event page did not establish the KYC rule.

## AI disclosure

This package was produced with AI assistance. A human entrant must review the product decisions, source code, tests, claims and demo, and must not state that the work was produced without AI. No experience, user traction, deployment, audit or security assurance should be claimed unless independently verified.
