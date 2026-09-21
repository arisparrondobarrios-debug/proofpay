import assert from "node:assert/strict";
import { buildAnchorCall as buildBrowserAnchor } from "./anchor.mjs";
import { buildAnchorCall as buildLibraryAnchor } from "../lib/receipt-core.mjs";

const proof = {
  schema: "proofpay.receipt.v1",
  chain: "Arbitrum One",
  chainId: 42161,
  transactionHash: `0x${"ab".repeat(32)}`,
  blockNumber: 300_000_000,
  asset: {
    symbol: "USDG",
    decimals: 6,
    contractAddress: "0x004b506865409877c9fa29bfb1eba929984b9bbc",
  },
  transfer: {
    from: "0x1111111111111111111111111111111111111111",
    to: "0x2222222222222222222222222222222222222222",
    rawAmount: "125000000",
    amount: "125",
    logIndex: 7,
  },
};

const browserResult = await buildBrowserAnchor(proof);
const libraryResult = await buildLibraryAnchor(proof);
assert.deepEqual(browserResult, libraryResult);
assert.match(browserResult.receiptHash, /^0x[0-9a-f]{64}$/);

console.log("ProofPay browser anchor parity test passed");
