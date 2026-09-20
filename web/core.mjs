export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export function normalizeHex(value) {
  return String(value || "").toLowerCase();
}

export function addressFromTopic(topic) {
  const value = normalizeHex(topic);
  if (!/^0x[0-9a-f]{64}$/.test(value)) {
    throw new Error("Invalid indexed address topic");
  }
  return `0x${value.slice(-40)}`;
}

export function formatUnits(raw, decimals = 6) {
  const value = BigInt(raw);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const integer = absolute / base;
  const fraction = (absolute % base)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`;
}

export function parseUsdcTransfers(receipt, contractAddress, decimals = 6) {
  if (!receipt || !Array.isArray(receipt.logs)) return [];

  const contract = normalizeHex(contractAddress);
  return receipt.logs
    .filter((log) => {
      const topics = Array.isArray(log.topics) ? log.topics : [];
      return (
        normalizeHex(log.address) === contract &&
        normalizeHex(topics[0]) === TRANSFER_TOPIC &&
        topics.length >= 3
      );
    })
    .map((log) => {
      const rawAmount = BigInt(log.data || "0x0");
      return {
        from: addressFromTopic(log.topics[1]),
        to: addressFromTopic(log.topics[2]),
        rawAmount: rawAmount.toString(),
        amount: formatUnits(rawAmount, decimals),
        logIndex: Number.parseInt(log.logIndex || "0x0", 16),
      };
    });
}

export function buildReceiptProof({
  chain,
  chainId,
  txHash,
  receipt,
  transfer,
  timestamp,
  confirmations,
  publicReference,
  contractAddress,
}) {
  if (!receipt || !transfer) throw new Error("Receipt and transfer are required");

  return {
    schema: "proofpay.receipt.v1",
    verifiedAt: new Date().toISOString(),
    chain,
    chainId,
    transactionHash: txHash,
    transactionStatus: receipt.status === "0x1" ? "confirmed" : "failed",
    blockNumber: Number.parseInt(receipt.blockNumber, 16),
    blockTimestamp: new Date(timestamp * 1000).toISOString(),
    confirmations,
    asset: {
      symbol: "USDC",
      decimals: 6,
      contractAddress,
    },
    transfer,
    publicReference: publicReference || null,
    verificationMethod: "Public JSON-RPC receipt and canonical USDC Transfer log",
    privacyNote: "No wallet connection, signature, seed phrase, or private key was used.",
  };
}
