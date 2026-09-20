import assert from "node:assert/strict";
import { buildAnchorCall, buildAnchorPayload, canonicalJson } from "../lib/receipt-core.mjs";

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

const payload = buildAnchorPayload(proof);
assert.equal(payload.schema, "proofpay.anchor.v1");
assert.equal(payload.asset.symbol, "USDG");
assert.equal(payload.transfer.rawAmount, "125000000");

assert.equal(
  canonicalJson({ z: 1, a: { y: 2, b: 3 } }),
  '{"a":{"b":3,"y":2},"z":1}',
);

const first = await buildAnchorCall(proof);
const second = await buildAnchorCall(JSON.parse(JSON.stringify(proof)));
assert.match(first.receiptHash, /^0x[0-9a-f]{64}$/);
assert.equal(first.receiptHash, second.receiptHash);
assert.equal(first.amount, "125000000");
assert.equal(first.sourceChainId, 42161);

const changed = structuredClone(proof);
changed.transfer.rawAmount = "125000001";
const changedCall = await buildAnchorCall(changed);
assert.notEqual(changedCall.receiptHash, first.receiptHash);

assert.throws(
  () => buildAnchorPayload({ ...proof, transactionHash: "0xdead" }),
  /transactionHash/,
);
assert.throws(
  () => buildAnchorPayload({ ...proof, transfer: { ...proof.transfer, rawAmount: "0" } }),
  /rawAmount/,
);

console.log("ProofPay Arbitrum receipt-core tests passed");
