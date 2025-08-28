import Web3 from "web3";
import { abi as UNISWAP_PAIR_ABI } from "./UniswapV2Pair.json"; 
import { abi as ERC20_ABI } from "./ERC20.json";

const web3 = new Web3(window.ethereum);

// 🔹 Router Addresses
const ROUTERS = {
  sepolia: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",   // UniswapV2Router02 (Sepolia)
  bscTestnet: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3" // PancakeV2Router02 (BSC Testnet)
};

// 🔹 Pair Addresses (👉 replace with actual ones from your TX logs)
const PAIRS = {
  sepolia: "0xYOUR_SEPOLIA_PAIR_ADDRESS",   // MYUSDT/ETH
  bscTestnet: "0xYOUR_BSC_PAIR_ADDRESS"     // MYUSDT/BNB
};

// 🔹 Token Addresses
const TOKENS = {
  sepolia: {
    MYUSDT: "0xc6C465b8E56757DB8dC54D7E11D0194182FEB475", // your Sepolia MYUSDT
    WETH:   "0x7751A2Ffa53c21e2493602FD06a4eC9c76C91b93"  // WETH on Sepolia
  },
  bscTestnet: {
    MYUSDT: "0x1c7e...YOUR_BSC_TOKEN", // your BSC MYUSDT
    WBNB:   "0xae13d989dac2f0debff460ac112a837c89baa7cd" // WBNB on BSC Testnet
  }
};

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const accounts = await web3.eth.getAccounts();
  document.getElementById("walletAddress").innerText = accounts[0];
  return accounts[0];
}

async function loadPair(chain) {
  const pairAddress = PAIRS[chain];
  const pairContract = new web3.eth.Contract(UNISWAP_PAIR_ABI, pairAddress);

  const token0 = await pairContract.methods.token0().call();
  const token1 = await pairContract.methods.token1().call();
  const reserves = await pairContract.methods.getReserves().call();

  console.log(`Pair on ${chain}:`, { token0, token1, reserves });
  document.getElementById("pairInfo").innerText =
    `Chain: ${chain}\nToken0: ${token0}\nToken1: ${token1}\nReserves: ${JSON.stringify(reserves)}`;
}

document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("loadSepoliaPair").addEventListener("click", () => loadPair("sepolia"));
document.getElementById("loadBscPair").addEventListener("click", () => loadPair("bscTestnet"));
