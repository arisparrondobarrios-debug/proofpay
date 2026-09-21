const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const BYTES32_RE = /^0x[0-9a-f]{64}$/;

function normalizeHex(value) {
  return String(value || "").toLowerCase();
}

function assertAddress(value, field) {
  const normalized = normalizeHex(value);
  if (!ADDRESS_RE.test(normalized) || /^0x0{40}$/.test(normalized)) {
    throw new Error(`${field} must be a non-zero EVM address`);
  }
  return normalized;
}

function assertBytes32(value, field) {
  const normalized = normalizeHex(value);
  if (!BYTES32_RE.test(normalized) || /^0x0{64}$/.test(normalized)) {
    throw new Error(`${field} must be a non-zero 32-byte hex value`);
  }
  return normalized;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

export function buildAnchorPayload(proof) {
  if (!proof || proof.schema !== "proofpay.receipt.v1") {
    throw new Error("Expected a proofpay.receipt.v1 record");
  }
  const chainId = Number(proof.chainId);
  const blockNumber = Number(proof.blockNumber);
  const logIndex = Number(proof.transfer?.logIndex);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new Error("Invalid chainId");
  if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) throw new Error("Invalid blockNumber");
  if (!Number.isSafeInteger(logIndex) || logIndex < 0) throw new Error("Invalid logIndex");
  const rawAmount = String(proof.transfer?.rawAmount || "");
  if (!/^[1-9][0-9]*$/.test(rawAmount)) throw new Error("Invalid rawAmount");
  return {
    schema: "proofpay.anchor.v1",
    source: {
      chainId,
      transactionHash: assertBytes32(proof.transactionHash, "transactionHash"),
      blockNumber,
      logIndex,
    },
    asset: {
      symbol: String(proof.asset?.symbol || "").toUpperCase(),
      decimals: Number(proof.asset?.decimals),
      contractAddress: assertAddress(proof.asset?.contractAddress, "contractAddress"),
    },
    transfer: {
      from: assertAddress(proof.transfer?.from, "from"),
      to: assertAddress(proof.transfer?.to, "to"),
      rawAmount,
    },
  };
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function buildAnchorCall(proof) {
  const payload = buildAnchorPayload(proof);
  return {
    receiptHash: await sha256Hex(payload),
    sourceChainId: payload.source.chainId,
    sourceTxHash: payload.source.transactionHash,
    token: payload.asset.contractAddress,
    payer: payload.transfer.from,
    payee: payload.transfer.to,
    amount: payload.transfer.rawAmount,
    payload,
  };
}
