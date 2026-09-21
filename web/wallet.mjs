const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const ARBITRUM_SEPOLIA_HEX = "0x66eee";
const ETHERS_MODULE = "https://esm.sh/ethers@6.15.0";

import { PROOFPAY_REGISTRY_BYTECODE } from "./registry-bytecode.mjs";

const REGISTRY_ABI = [
  "function anchorReceipt(bytes32 receiptHash,uint256 sourceChainId,bytes32 sourceTxHash,address token,address payer,address payee,uint256 amount)",
];

export function isEvmAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(String(value || "").trim());
}

export async function connectWallet() {
  if (!globalThis.ethereum) {
    throw new Error("No compatible EVM wallet was detected. Use a wallet with Arbitrum support, such as MetaMask or Rabby.");
  }
  const { BrowserProvider } = await import(ETHERS_MODULE);
  const provider = new BrowserProvider(globalThis.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts?.[0] || !isEvmAddress(accounts[0])) throw new Error("The wallet did not return an EVM address");
  return accounts[0];
}

async function switchToArbitrumSepolia(provider) {
  const current = await provider.send("eth_chainId", []);
  if (Number.parseInt(current, 16) === ARBITRUM_SEPOLIA_CHAIN_ID) return;

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: ARBITRUM_SEPOLIA_HEX }]);
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await provider.send("wallet_addEthereumChain", [
      {
        chainId: ARBITRUM_SEPOLIA_HEX,
        chainName: "Arbitrum Sepolia",
        nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
        blockExplorerUrls: ["https://sepolia.arbiscan.io"],
      },
    ]);
  }
}

export async function anchorReceipt({ registryAddress, anchor }) {
  if (!isEvmAddress(registryAddress)) throw new Error("Enter a valid registry contract address");
  if (!globalThis.ethereum) {
    throw new Error("No compatible EVM wallet was detected. Use a wallet with Arbitrum support, such as MetaMask or Rabby.");
  }

  const { BrowserProvider, Contract } = await import(ETHERS_MODULE);
  const provider = new BrowserProvider(globalThis.ethereum);
  await provider.send("eth_requestAccounts", []);
  await switchToArbitrumSepolia(provider);
  const signer = await provider.getSigner();
  const registry = new Contract(registryAddress, REGISTRY_ABI, signer);
  const transaction = await registry.anchorReceipt(
    anchor.receiptHash,
    anchor.sourceChainId,
    anchor.sourceTxHash,
    anchor.token,
    anchor.payer,
    anchor.payee,
    anchor.amount,
  );

  return {
    hash: transaction.hash,
    explorerUrl: `https://sepolia.arbiscan.io/tx/${transaction.hash}`,
  };
}

export async function deployRegistry() {
  if (!globalThis.ethereum) {
    throw new Error("No compatible EVM wallet was detected. Use a wallet with Arbitrum support, such as MetaMask or Rabby.");
  }

  const { BrowserProvider, ContractFactory } = await import(ETHERS_MODULE);
  const provider = new BrowserProvider(globalThis.ethereum);
  await provider.send("eth_requestAccounts", []);
  await switchToArbitrumSepolia(provider);
  const signer = await provider.getSigner();
  const factory = new ContractFactory(REGISTRY_ABI, PROOFPAY_REGISTRY_BYTECODE, signer);
  const registry = await factory.deploy();
  const transaction = registry.deploymentTransaction();
  await registry.waitForDeployment();
  const address = await registry.getAddress();

  return {
    address,
    hash: transaction.hash,
    explorerUrl: `https://sepolia.arbiscan.io/address/${address}`,
  };
}
