import { Contract, ContractFactory, JsonRpcProvider, Wallet } from "ethers";
import { PROOFPAY_REGISTRY_BYTECODE } from "../web/registry-bytecode.mjs";

const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";
const ABI = [
  "function anchorReceipt(bytes32 receiptHash,uint256 sourceChainId,bytes32 sourceTxHash,address token,address payer,address payee,uint256 amount)",
  "function receiptExists(bytes32 receiptHash) view returns (bool)",
];
const DEMO = {
  receiptHash: "0xd73740764c58b2c875c03ff0ccc3cc6d90d21d75ac2c08f07a47195947c14a27",
  sourceChainId: 42161n,
  sourceTxHash: `0x${"d".repeat(64)}`,
  token: "0x004B506865409877C9fA29bfb1ebA929984B9bbC",
  payer: `0x${"1".repeat(40)}`,
  payee: `0x${"2".repeat(40)}`,
  amount: 750000000n,
};

const provider = new JsonRpcProvider(RPC_URL, 421614, { staticNetwork: true });
const signer = Wallet.createRandom().connect(provider);
console.log(`TEST_WALLET_ADDRESS=${signer.address}`);
console.log("WAITING_FOR_ARBITRUM_SEPOLIA_ETH");

let balance = 0n;
while (balance === 0n) {
  balance = await provider.getBalance(signer.address);
  if (balance === 0n) await new Promise((resolve) => setTimeout(resolve, 2000));
}

console.log(`FUNDED_WEI=${balance}`);
const factory = new ContractFactory(ABI, PROOFPAY_REGISTRY_BYTECODE, signer);
const registry = await factory.deploy();
const deployment = registry.deploymentTransaction();
await registry.waitForDeployment();
const address = await registry.getAddress();
console.log(`DEPLOY_TX=${deployment.hash}`);
console.log(`REGISTRY_ADDRESS=${address}`);

const connected = new Contract(address, ABI, signer);
const anchorTx = await connected.anchorReceipt(
  DEMO.receiptHash,
  DEMO.sourceChainId,
  DEMO.sourceTxHash,
  DEMO.token,
  DEMO.payer,
  DEMO.payee,
  DEMO.amount,
);
await anchorTx.wait();
const exists = await connected.receiptExists(DEMO.receiptHash);
console.log(`ANCHOR_TX=${anchorTx.hash}`);
console.log(`DEMO_RECEIPT_EXISTS=${exists}`);
