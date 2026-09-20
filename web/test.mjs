import assert from "node:assert/strict";
import {
  TRANSFER_TOPIC,
  addressFromTopic,
  buildReceiptProof,
  formatUnits,
  parseUsdcTransfers,
} from "./core.mjs";

const sender = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";
const contract = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const topicAddress = (address) => `0x${address.slice(2).padStart(64, "0")}`;

assert.equal(addressFromTopic(topicAddress(sender)), sender);
assert.equal(formatUnits(123456789n, 6), "123.456789");
assert.equal(formatUnits(1000000n, 6), "1");

const receipt = {
  status: "0x1",
  blockNumber: "0x64",
  logs: [
    {
      address: contract,
      topics: [TRANSFER_TOPIC, topicAddress(sender), topicAddress(recipient)],
      data: "0x2cb417800",
      logIndex: "0x4",
    },
    {
      address: "0x3333333333333333333333333333333333333333",
      topics: [TRANSFER_TOPIC, topicAddress(sender), topicAddress(recipient)],
      data: "0x1",
      logIndex: "0x5",
    },
  ],
};

const transfers = parseUsdcTransfers(receipt, contract);
assert.equal(transfers.length, 1);
assert.deepEqual(transfers[0], {
  from: sender,
  to: recipient,
  rawAmount: "12000000000",
  amount: "12000",
  logIndex: 4,
});

const proof = buildReceiptProof({
  chain: "Arbitrum One",
  chainId: 42161,
  txHash: `0x${"a".repeat(64)}`,
  receipt,
  transfer: transfers[0],
  timestamp: 1_700_000_000,
  confirmations: 42,
  publicReference: "INV-42",
  contractAddress: contract,
});

assert.equal(proof.schema, "proofpay.receipt.v1");
assert.equal(proof.transactionStatus, "confirmed");
assert.equal(proof.asset.symbol, "USDC");
assert.equal(proof.publicReference, "INV-42");
assert.equal(proof.confirmations, 42);

console.log("ProofPay core tests passed");
