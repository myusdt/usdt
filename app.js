// =============================
// MYUSDT Multi-Chain Dashboard Frontend
// =============================

import Web3 from "web3";

// =============================
// CONFIGURATION
// =============================
const RPCS = {
  sepolia: "https://sepolia.infura.io/v3/afc846803e384cc583a4a260f693cd71",
  bscTestnet: "https://data-seed-prebsc-1-s1.binance.org:8545/"
};

const ROUTERS = {
  sepolia: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  bscTestnet: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
};

const PAIRS = {
  sepolia: "0x6c3e4cb2e96b01f4b866965a91ed4437839a121a",
  bscTestnet: "0xc15fa3e22c912a276550f3e5fe3b0deb87b55acd"
};

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

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const LP_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const BRIDGE_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// =============================
// WEB3 PROVIDERS
// =============================
const web3Instances = {
  sepolia: new Web3(RPCS.sepolia),
  bscTestnet: new Web3(RPCS.bscTestnet)
};

// =============================
// HELPERS
// =============================
function formatBalance(balance, decimals = 18) {
  if (!balance) return "0";
  return (Number(balance) / 10 ** decimals).toLocaleString();
}

// =============================
// DASHBOARD FUNCTIONS
// =============================
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not detected! Please install it.");
    return;
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const walletAddress = accounts[0];
  const el = document.getElementById("walletAddress");
  if (el) el.innerText = walletAddress;
  await loadWalletBalance(walletAddress);
  return walletAddress;
}

async function loadWalletBalance(walletAddress) {
  try {
    const providerSepolia = web3Instances.sepolia;
    const providerBsc = web3Instances.bscTestnet;

    const tokenSepolia = new providerSepolia.eth.Contract(ERC20_ABI, TOKENS.sepolia.MYUSDT);
    const tokenBsc = new providerBsc.eth.Contract(ERC20_ABI, TOKENS.bscTestnet.MYUSDT);

    const balanceSepolia = await tokenSepolia.methods.balanceOf(walletAddress).call();
    const balanceBsc = await tokenBsc.methods.balanceOf(walletAddress).call();

    const el = document.getElementById("userBalance");
    if (el) el.innerText = `Sepolia: ${formatBalance(balanceSepolia)} | BSC: ${formatBalance(balanceBsc)}`;
  } catch (err) {
    console.error("Error loading wallet balances:", err);
  }
}

async function loadTokenData(chain) {
  try {
    const provider = web3Instances[chain];
    const tokenContract = new provider.eth.Contract(ERC20_ABI, TOKENS[chain].MYUSDT);
    const totalSupply = await tokenContract.methods.totalSupply().call();

    const el = document.getElementById("totalSupply");
    if (el) el.innerText = formatBalance(totalSupply);
  } catch (err) {
    console.error(`Error loading token data for ${chain}:`, err);
  }
}

async function loadLPData(chain) {
  try {
    const provider = web3Instances[chain];
    const pairContract = new provider.eth.Contract(LP_ABI, PAIRS[chain]);
    const reserves = await pairContract.methods.getReserves().call();
    const token0 = await pairContract.methods.token0().call();
    const token1 = await pairContract.methods.token1().call();

    const el = document.getElementById(
      chain === "sepolia" ? "uniReserves" : "pancakeReserves"
    );
    if (el) el.innerText = `Token0: ${token0}\nToken1: ${token1}\nReserves: ${reserves.reserve0} / ${reserves.reserve1}`;
  } catch (err) {
    console.error(`Error loading LP data for ${chain}:`, err);
    const el = document.getElementById(
      chain === "sepolia" ? "uniReserves" : "pancakeReserves"
    );
    if (el) el.innerText = "LP tracking failed or pool not created.";
  }
}

async function loadBridgeStatus() {
  try {
    const providerSepolia = web3Instances.sepolia;
    const providerBsc = web3Instances.bscTestnet;

    const bridgeSepolia = new providerSepolia.eth.Contract(BRIDGE_ABI, TOKENS.sepolia.MYUSDT);
    const bridgeBsc = new providerBsc.eth.Contract(BRIDGE_ABI, TOKENS.bscTestnet.MYUSDT);

    const eventsSepolia = await bridgeSepolia.getPastEvents("Transfer", { fromBlock: 0, toBlock: "latest" });
    const eventsBsc = await bridgeBsc.getPastEvents("Transfer", { fromBlock: 0, toBlock: "latest" });

    const lastSepolia = eventsSepolia[eventsSepolia.length - 1];
    const lastBsc = eventsBsc[eventsBsc.length - 1];

    const el = document.getElementById("bridgeStatus");
    if (el) {
      el.innerText = `
Sepolia Last Transfer:
From: ${lastSepolia?.returnValues?.from || "--"}
To: ${lastSepolia?.returnValues?.to || "--"}
Value: ${formatBalance(lastSepolia?.returnValues?.value || 0)}

BSC Last Transfer:
From: ${lastBsc?.returnValues?.from || "--"}
To: ${lastBsc?.returnValues?.to || "--"}
Value: ${formatBalance(lastBsc?.returnValues?.value || 0)}
      `;
    }
  } catch (err) {
    console.error("Error loading bridge status:", err);
    const el = document.getElementById("bridgeStatus");
    if (el) el.innerText = "Failed to load bridge status.";
  }
}

// =============================
// EXPORT FUNCTIONS TO WINDOW
// =============================
window.connectWallet = connectWallet;
window.loadLPData = loadLPData;
window.loadBridgeStatus = loadBridgeStatus;
window.loadTokenData = loadTokenData;

// =============================
// INITIALIZE DASHBOARD ON LOAD
// =============================
window.addEventListener("load", async () => {
  await connectWallet();
  await loadTokenData("sepolia");
  await loadTokenData("bscTestnet");
  await loadLPData("sepolia");
  await loadLPData("bscTestnet");
  await loadBridgeStatus();
});
