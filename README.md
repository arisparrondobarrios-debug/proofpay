# ProofPay

ProofPay turns public stablecoin transfer facts into a portable work-payment receipt and can anchor a privacy-conscious receipt digest on Arbitrum.

## Repository status

**Live demo:** https://proofpay-arbitrum.clod.chatgpt.site/

The web demo is publicly deployed as a pre-submission candidate for Arbitrum Open House Singapore. The registry contract has not yet been deployed or audited, and the project makes no user or traction claims.

The read-only receipt verifier in `web/` predates the Open House build window. The receipt commitment schema, deterministic hashing module, Solidity registry, and associated tests were added for the Open House package. This distinction must remain in any hackathon submission.

## Components

- `web/`: read-only multi-chain USDC receipt verifier with an offline demo.
- `web/anchor.mjs`: browser-safe canonicalization and digest preparation for the interactive demo.
- `web/wallet.mjs`: optional, user-reviewed Arbitrum Sepolia anchoring through an injected EVM wallet.
- `web/registry-bytecode.mjs`: reproducible browser deployment bytecode compiled from the registry source.
- `contracts/ProofPayReceiptRegistry.sol`: dependency-free receipt commitment registry.
- `lib/receipt-core.mjs`: validation, canonicalization, hashing, and contract-call preparation.
- `test/receipt-core.test.mjs`: commitment-layer unit tests.
- `docs/SUBMISSION-PACK.md`: positioning, demo flow, disclosure, and owner gates.

## Safety boundary

The verifier reads public RPC data and never asks for a private key or seed phrase. Anchoring a digest is optional and requires the user to review and sign a transaction in their own wallet. This repository does not contain a deployment key, payout address, secret, mainnet transaction, or live contract address.

The contract is unaudited experimental software. Use Arbitrum Sepolia and faucet assets for hackathon testing; do not use mainnet funds.

## Local checks

```sh
node --test web/test.mjs
node --test web/anchor.test.mjs
node --test test/receipt-core.test.mjs
node --check web/app.js
node --check web/core.mjs
node --check lib/receipt-core.mjs
```

## Disclosure

AI assistance was used for research synthesis, implementation, tests, and documentation. Before submission, the entrant must personally review the code and claims, run the checks, complete any required rules and identity declarations, and be able to explain the product and security boundary.

Released under the MIT License.
