import test from "node:test";
import assert from "node:assert/strict";

import { isEvmAddress } from "./wallet.mjs";
import { PROOFPAY_REGISTRY_BYTECODE } from "./registry-bytecode.mjs";

test("accepts a 20-byte EVM contract address", () => {
  assert.equal(isEvmAddress(`0x${"a".repeat(40)}`), true);
});

test("rejects incomplete and non-hex registry values", () => {
  assert.equal(isEvmAddress("0x1234"), false);
  assert.equal(isEvmAddress(`0x${"z".repeat(40)}`), false);
});

test("ships deployable registry bytecode", () => {
  assert.match(PROOFPAY_REGISTRY_BYTECODE, /^0x[0-9a-f]+$/);
  assert.ok(PROOFPAY_REGISTRY_BYTECODE.length > 1000);
});
