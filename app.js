// =============================
// MYUSDT Dashboard Frontend Logic
// =============================

// Using web3.js
import Web3 from "web3";
import { abi as UNISWAP_PAIR_ABI } from "./UniswapV2Pair.json";
import { abi as ERC20_ABI } from "./ERC20.json";

const web3 = new Web3(window.ethereum);

// 🔹 Router Addresses
const ROUTERS = {
  sepolia: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",   // UniswapV2Router02
  bscTestnet: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"  // PancakeV2Router02
};

// 🔹 Pair Addresses (replace after pool creation)
const PAIRS = {
  sepolia: "0xYOUR_SEPOLIA_PAIR_ADDRESS", // MYUSDT/ETH
  bscTestnet: "0xYOUR_BSC_PAIR_ADDRESS"   // MYUSDT/BNB
};

// 🔹 Token Addresses
const TOKENS = {
  sepolia: {
    MYUSDT: "0xc6C465b8E56757DB8dC54D7E11D0194182FEB475",
    WETH: "0x7751A2Ffa53c21e2493602FD06a4eC9c76C91b93"
  },
  bscTestnet: {
    MYUSDT: "0x1c7e5094413Be138C1561D05c2Be92364d74b5b2",
    WBNB: "0xae13d989dac2f0debff460ac112a837c89baa7cd"
  }
};

// =============================
// Wallet Connection
// =============================
async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const wallet = accounts[0];
    document.getElementById("userAddress")?.innerText = wallet;
    console.log("Connected wallet:", wallet);
    return wallet;
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

// =============================
// Load LP Data
// =============================
async function loadLP(chain) {
  try {
    const pairAddress = PAIRS[chain];
    if (!pairAddress || pairAddress.includes("YOUR")) {
      console.warn(`Pair address for ${chain} not set yet.`);
      document.getElementById(chain === "sepolia" ? "uniReserves" : "pancakeReserves").innerText =
        "Pair not created yet.";
      return;
    }

    const pairContract = new web3.eth.Contract(UNISWAP_PAIR_ABI, pairAddress);
    const [token0, token1, reserves] = await Promise.all([
      pairContract.methods.token0().call(),
      pairContract.methods.token1().call(),
      pairContract.methods.getReserves().call()
    ]);

    const display = `Token0: ${token0}\nToken1: ${token1}\nReserve0: ${reserves._reserve0}\nReserve1: ${reserves._reserve1}`;
    document.getElementById(chain === "sepolia" ? "uniReserves" : "pancakeReserves").innerText = display;
    console.log(`LP ${chain}:`, display);
  } catch (err) {
    console.error(`Error loading LP for ${chain}:`, err);
  }
}

// =============================
// Bridge Status Loader
// =============================
async function loadBridgeStatus() {
  try {
    // 🔹 Replace with actual bridge contract events / logs if available
    // For demo, we’ll simulate the latest transfer
    const latestTransfer = {
      from: "0xFromAddress...",
      to: "0xToAddress...",
      amount: "100 MYUSDT",
      chain: "Sepolia → BSC Testnet",
      timestamp: new Date().toLocaleString()
    };
    document.getElementById("bridgeStatus").innerText = JSON.stringify(latestTransfer, null, 2);
  } catch (err) {
    console.error("Error loading bridge status:", err);
    document.getElementById("bridgeStatus").innerText = "Error fetching bridge status.";
  }
}

// =============================
// Refresh Handlers
// =============================
document.getElementById("refresh-btn")?.addEventListener("click", async () => {
  await loadLP("sepolia");
  await loadLP("bscTestnet");
  await loadBridgeStatus();
  document.getElementById("last-updated").innerText = `Last updated: ${new Date().toLocaleString()}`;
});

document.getElementById("refreshBridge")?.addEventListener("click", async () => {
  await loadBridgeStatus();
  document.getElementById("last-updated").innerText = `Last updated: ${new Date().toLocaleString()}`;
});

// =============================
// On Page Load
// =============================
window.addEventListener("load", async () => {
  await connectWallet();
  await loadLP("sepolia");
  await loadLP("bscTestnet");
  await loadBridgeStatus();
});
