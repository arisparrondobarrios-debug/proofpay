# ProofPay

ProofPay turns public stablecoin transfer facts into a portable work-payment receipt and can anchor a privacy-conscious receipt digest on Arbitrum.

## Repository status

**Live demo:** https://proofpay-arbitrum.clod.chatgpt.site/

The web demo is publicly deployed as a pre-submission candidate for Arbitrum Open House Singapore. The registry contract is live on Arbitrum Sepolia and remains unaudited; the project makes no user or traction claims.

- **Registry:** https://sepolia.arbiscan.io/address/0x19A333DCcE504858AedAd6D8E3cd3d9d7FB6ECed
- **Deployment transaction:** https://sepolia.arbiscan.io/tx/0x61d3c505f536c7f005ad9a847e4351ec7bd9fcc872833e559ef39d3961042f87
- **Demo anchor transaction:** https://sepolia.arbiscan.io/tx/0x6881d3ce2fcf2e61d5cffb916d57e0a0e1269e045d0c4034243f1e1450c383e1

The read-only receipt verifier in `web/` predates the Open House build window. The receipt commitment schema, deterministic hashing module, Solidity registry, and associated tests were added for the Open House package. This distinction must remain in any hackathon submission.

## Components

- `web/`: read-only multi-chain USDC receipt verifier with an offline demo.
- `web/anchor.mjs`: browser-safe canonicalization and digest preparation for the interactive demo.
- `web/wallet.mjs`: optional, user-reviewed Arbitrum Sepolia anchoring through an injected EVM wallet.
- `web/registry-bytecode.mjs`: reproducible browser deployment bytecode compiled from the registry source.
- `contracts/ProofPayReceiptRegistry.sol`: dependency-free receipt commitment registry.
- `scripts/deploy-demo.mjs`: reproducible testnet-only deployment and demo anchoring flow.
- `lib/receipt-core.mjs`: validation, canonicalization, hashing, and contract-call preparation.
- `test/receipt-core.test.mjs`: commitment-layer unit tests.
- `docs/SUBMISSION-PACK.md`: positioning, demo flow, disclosure, and owner gates.

## Safety boundary

The verifier reads public RPC data and never asks for a private key or seed phrase. Anchoring a new digest is optional and requires the user to review and sign a transaction in a compatible wallet. The published registry was deployed from a disposable testnet-only signer kept in memory; the contract has no administrator or owner role and the signer key was not retained. This repository contains no deployment key, payout address, secret, or mainnet transaction.

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

The live deployment and demo anchor were independently read back from Arbitrum Sepolia after both receipts returned status `1` and `receiptExists(demoDigest)` returned `true`.

## Disclosure

AI assistance was used for research synthesis, implementation, tests, and documentation. Before submission, the entrant must personally review the code and claims, run the checks, complete any required rules and identity declarations, and be able to explain the product and security boundary.

Released under the MIT License.
