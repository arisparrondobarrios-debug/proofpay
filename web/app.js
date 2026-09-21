import { buildReceiptProof, parseUsdcTransfers } from "./core.mjs?v=proofpay-2";
import { buildAnchorCall } from "./anchor.mjs?v=proofpay-2";
import { anchorReceipt, connectWallet, deployRegistry, isEvmAddress } from "./wallet.mjs?v=proofpay-5";

const CHAINS = {
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    rpc: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io/tx/",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  base: {
    name: "Base",
    chainId: 8453,
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org/tx/",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpc: "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io/tx/",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
};

const form = document.querySelector("#verify-form");
const chainInput = document.querySelector("#chain");
const txInput = document.querySelector("#tx-hash");
const referenceInput = document.querySelector("#public-reference");
const submitButton = document.querySelector("#verify-button");
const demoButton = document.querySelector("#demo-button");
const statusBox = document.querySelector("#status");
const result = document.querySelector("#result");
const downloadButton = document.querySelector("#download-button");
const resetButton = document.querySelector("#reset-button");
const copyHashButton = document.querySelector("#copy-hash-button");
const registryAddressInput = document.querySelector("#registry-address");
const anchorButton = document.querySelector("#anchor-button");
const connectWalletButton = document.querySelector("#connect-wallet-button");
const deployRegistryButton = document.querySelector("#deploy-registry-button");
const anchorStatus = document.querySelector("#anchor-status");

const LIVE_REGISTRY = "0x19A333DCcE504858AedAd6D8E3cd3d9d7FB6ECed";
const DEMO_RECEIPT_HASH = "0xd73740764c58b2c875c03ff0ccc3cc6d90d21d75ac2c08f07a47195947c14a27";
const DEMO_ANCHOR_URL = "https://sepolia.arbiscan.io/tx/0x6881d3ce2fcf2e61d5cffb916d57e0a0e1269e045d0c4034243f1e1450c383e1";

let latestProof = null;
let latestAnchor = null;

async function rpc(url, method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "RPC error");
  return payload.result;
}

function shortAddress(value) {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function setStatus(message, kind = "neutral") {
  statusBox.textContent = message;
  statusBox.dataset.kind = kind;
  statusBox.hidden = false;
}

async function renderProof(proof, explorerUrl) {
  latestProof = proof;
  document.querySelector("#amount").textContent = `${proof.transfer.amount} ${proof.asset.symbol}`;
  document.querySelector("#network").textContent = proof.chain;
  document.querySelector("#sender").textContent = shortAddress(proof.transfer.from);
  document.querySelector("#sender").title = proof.transfer.from;
  document.querySelector("#recipient").textContent = shortAddress(proof.transfer.to);
  document.querySelector("#recipient").title = proof.transfer.to;
  document.querySelector("#block-time").textContent = new Date(
    proof.blockTimestamp,
  ).toLocaleString();
  document.querySelector("#confirmations").textContent =
    proof.confirmations.toLocaleString();
  document.querySelector("#reference-output").textContent =
    proof.publicReference || "No public reference supplied";
  const explorer = document.querySelector("#explorer-link");
  explorer.href = `${explorerUrl}${proof.transactionHash}`;
  const anchor = await buildAnchorCall(proof);
  latestAnchor = anchor;
  document.querySelector("#receipt-hash").textContent = anchor.receiptHash;
  document.querySelector("#anchor-chain").textContent = String(anchor.sourceChainId);
  document.querySelector("#anchor-token").textContent = shortAddress(anchor.token);
  document.querySelector("#anchor-token").title = anchor.token;
  document.querySelector("#anchor-amount").textContent = anchor.amount;
  copyHashButton.dataset.hash = anchor.receiptHash;
  anchorButton.disabled = !isEvmAddress(registryAddressInput.value);
  if (anchor.receiptHash === DEMO_RECEIPT_HASH) {
    anchorStatus.innerHTML = "";
    const link = document.createElement("a");
    link.href = DEMO_ANCHOR_URL;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Demo digest anchored on Arbitrum Sepolia ↗";
    anchorStatus.append(link);
  } else {
    anchorStatus.textContent = "Prepared locally · no transaction sent";
  }
  result.hidden = false;
  setStatus("Verified from public onchain data.", "success");
}

async function verifyTransaction(event) {
  event.preventDefault();
  const txHash = txInput.value.trim();
  const config = CHAINS[chainInput.value];
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    setStatus("Enter a 0x-prefixed 32-byte transaction hash.", "error");
    return;
  }

  submitButton.disabled = true;
  result.hidden = true;
  setStatus("Reading the public transaction receipt…", "neutral");

  try {
    const receipt = await rpc(config.rpc, "eth_getTransactionReceipt", [txHash]);
    if (!receipt) throw new Error("Transaction not found on the selected chain");
    if (receipt.status !== "0x1") throw new Error("Transaction failed onchain");

    const transfers = parseUsdcTransfers(receipt, config.usdc);
    if (!transfers.length) {
      throw new Error("No native USDC Transfer event found in this transaction");
    }

    const [block, latestBlock] = await Promise.all([
      rpc(config.rpc, "eth_getBlockByNumber", [receipt.blockNumber, false]),
      rpc(config.rpc, "eth_blockNumber", []),
    ]);
    if (!block) throw new Error("Block data unavailable");

    const confirmations = Math.max(
      0,
      Number.parseInt(latestBlock, 16) - Number.parseInt(receipt.blockNumber, 16) + 1,
    );
    const proof = buildReceiptProof({
      chain: config.name,
      chainId: config.chainId,
      txHash,
      receipt,
      transfer: transfers[0],
      timestamp: Number.parseInt(block.timestamp, 16),
      confirmations,
      publicReference: referenceInput.value.trim(),
      contractAddress: config.usdc,
    });
    await renderProof(proof, config.explorer);
  } catch (error) {
    setStatus(error.message || "Verification failed", "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function showDemo() {
  const demo = {
    schema: "proofpay.receipt.v1",
    verifiedAt: new Date().toISOString(),
    chain: "Arbitrum One — demo data",
    chainId: 42161,
    transactionHash: `0x${"d".repeat(64)}`,
    transactionStatus: "confirmed",
    blockNumber: 298765432,
    blockTimestamp: new Date(Date.now() - 3600_000).toISOString(),
    confirmations: 3210,
    asset: {
      symbol: "USDG",
      decimals: 6,
      contractAddress: "0x004B506865409877C9fA29bfb1ebA929984B9bbC",
    },
    transfer: {
      from: `0x${"1".repeat(40)}`,
      to: `0x${"2".repeat(40)}`,
      rawAmount: "750000000",
      amount: "750",
      logIndex: 4,
    },
    publicReference: "DEMO-ONLY — not evidence of payment",
    verificationMethod: "Demonstration fixture; no RPC call was made",
    privacyNote: "No wallet connection, signature, seed phrase, or private key was used.",
  };
  await renderProof(demo, "https://arbiscan.io/tx/");
  setStatus("Demo mode: illustrative data only, not a real payment.", "warning");
}

function downloadProof() {
  if (!latestProof) return;
  const blob = new Blob([JSON.stringify(latestProof, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `proofpay-${latestProof.transactionHash.slice(2, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", verifyTransaction);
demoButton.addEventListener("click", showDemo);
downloadButton.addEventListener("click", downloadProof);
resetButton.addEventListener("click", () => {
  form.reset();
  result.hidden = true;
  statusBox.hidden = true;
  latestProof = null;
  latestAnchor = null;
  anchorButton.disabled = true;
  anchorStatus.textContent = "Prepared locally · no transaction sent";
  registryAddressInput.value = LIVE_REGISTRY;
});

copyHashButton.addEventListener("click", async () => {
  const hash = copyHashButton.dataset.hash;
  if (!hash) return;
  try {
    await navigator.clipboard.writeText(hash);
    anchorStatus.textContent = "Digest copied · no transaction sent";
  } catch {
    anchorStatus.textContent = "Select the digest above to copy it";
  }
});

registryAddressInput.addEventListener("input", () => {
  anchorButton.disabled = !latestAnchor || !isEvmAddress(registryAddressInput.value);
});

connectWalletButton.addEventListener("click", async () => {
  connectWalletButton.disabled = true;
  anchorStatus.textContent = "Waiting for wallet permission…";
  try {
    const address = await connectWallet();
    anchorStatus.innerHTML = "";
    const addressText = document.createElement("span");
    addressText.id = "connected-wallet";
    addressText.dataset.address = address;
    addressText.textContent = `Wallet ${shortAddress(address)} · `;
    const faucet = document.createElement("a");
    faucet.href = "https://faucet.quicknode.com/arbitrum/sepolia";
    faucet.target = "_blank";
    faucet.rel = "noreferrer";
    faucet.textContent = "Get test ETH ↗";
    anchorStatus.append(addressText, faucet);
  } catch (error) {
    anchorStatus.textContent = error?.message || "Wallet was not connected";
  } finally {
    connectWalletButton.disabled = false;
  }
});

deployRegistryButton.addEventListener("click", async () => {
  deployRegistryButton.disabled = true;
  anchorStatus.textContent = "Waiting for wallet review…";
  try {
    const deployment = await deployRegistry();
    registryAddressInput.value = deployment.address;
    anchorButton.disabled = !latestAnchor;
    anchorStatus.innerHTML = "";
    const link = document.createElement("a");
    link.href = deployment.explorerUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Registry deployed · view on Arbiscan ↗";
    anchorStatus.append(link);
  } catch (error) {
    anchorStatus.textContent = error?.message || "Registry was not deployed";
  } finally {
    deployRegistryButton.disabled = false;
  }
});

anchorButton.addEventListener("click", async () => {
  if (!latestAnchor) return;
  anchorButton.disabled = true;
  anchorStatus.textContent = "Waiting for wallet review…";
  try {
    const transaction = await anchorReceipt({
      registryAddress: registryAddressInput.value.trim(),
      anchor: latestAnchor,
    });
    anchorStatus.innerHTML = "";
    const link = document.createElement("a");
    link.href = transaction.explorerUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Transaction submitted · view on Arbiscan ↗";
    anchorStatus.append(link);
  } catch (error) {
    anchorStatus.textContent = error?.message || "Wallet transaction was not sent";
  } finally {
    anchorButton.disabled = !isEvmAddress(registryAddressInput.value);
  }
});
