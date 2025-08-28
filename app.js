// =============================
// MYUSDT Dashboard JS
// =============================

// CONFIGURATION
const RPCS = {
  sepolia: "https://sepolia.infura.io/v3/afc846803e384cc583a4a260f693cd71",
  bscTestnet: "https://data-seed-prebsc-1-s1.binance.org:8545/"
};

const PAIRS = {
  sepolia: "0x6c3e4cb2e96b01f4b866965a91ed4437839a121a",
  bscTestnet: "0xc15fa3e22c912a276550f3e5fe3b0deb87b55acd"
};

const TOKENS = {
  sepolia: { MYUSDT: "0xc6C465b8E56757DB8dC54D7E11D0194182FEB475" },
  bscTestnet: { MYUSDT: "0x1c7e5094413Be138C1561D05c2Be92364d74b5b2" }
};

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const LP_ABI = [
  "function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const BRIDGE_ABI = [
  "event Transfer(address indexed from,address indexed to,uint256 value)"
];

// WEB3 PROVIDERS
const web3Instances = {
  sepolia: new Web3(RPCS.sepolia),
  bscTestnet: new Web3(RPCS.bscTestnet)
};

// UTILITY
function formatBalance(balance, decimals=18){ return Number(balance)/10**decimals; }

// Connect Wallet
async function connectWallet(){
  if (window.ethereum) {
  const web3 = new Web3(window.ethereum);
} else {
  alert("MetaMask is required!");
}

// Load Token Data
async function loadTokenData() {
  try {
    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];

    // Sepolia token
    const sepoliaToken = new web3.eth.Contract(ERC20_ABI, TOKENS.sepolia.MYUSDT);
    const sepoSupply = await sepoliaToken.methods.totalSupply().call();
    const sepoBalance = await sepoliaToken.methods.balanceOf(userAddress).call();

    document.getElementById("totalSupply").innerText = formatBalance(sepoSupply);
    document.getElementById("userBalance").innerText = formatBalance(sepoBalance);
  } catch (err) { console.error(err); }
}


// Load LP Data
async function loadLPData(chain) {
  try {
    const web3 = new Web3(window.ethereum);
    const pairAddress = PAIRS[chain];
    const pairContract = new web3.eth.Contract(LP_ABI, pairAddress);
    const reserves = await pairContract.methods.getReserves().call();
    const token0 = await pairContract.methods.token0().call();
    const token1 = await pairContract.methods.token1().call();

    document.getElementById("pairInfo").innerText = `Token0: ${token0}\nToken1: ${token1}\nReserves: ${reserves.reserve0} / ${reserves.reserve1}`;
  } catch (err) {
    console.error(err);
    document.getElementById("pairInfo").innerText = "Failed to load LP data";
  }
}


// Load Bridge Status
async function loadBridgeStatus() {
  try {
    const web3 = new Web3(window.ethereum);

    // Sepolia
    const bridgeSepolia = new web3.eth.Contract(BRIDGE_ABI, TOKENS.sepolia.MYUSDT);
    const eventsSepolia = await bridgeSepolia.getPastEvents("Transfer", { fromBlock: 0, toBlock: "latest" });
    const lastSepolia = eventsSepolia[eventsSepolia.length - 1];

    // BSC Testnet
    const bridgeBsc = new web3.eth.Contract(BRIDGE_ABI, TOKENS.bscTestnet.MYUSDT);
    const eventsBsc = await bridgeBsc.getPastEvents("Transfer", { fromBlock: 0, toBlock: "latest" });
    const lastBsc = eventsBsc[eventsBsc.length - 1];

    const statusEl = document.getElementById("bridgeStatus");
    if (statusEl) {
      statusEl.innerText = `
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
    const statusEl = document.getElementById("bridgeStatus");
    if (statusEl) statusEl.innerText = "Failed to load bridge status.";
  }
}


// INITIALIZE
window.addEventListener("load", async ()=>{
  await connectWallet();
  await loadTokenData("sepolia");
  await loadTokenData("bscTestnet");
  await loadLPData("sepolia");
  await loadLPData("bscTestnet");
  if(document.getElementById("bridgeStatus")) await loadBridgeStatus();

  // Button Hooks
  const connectBtn = document.getElementById("connectBtn");
  if(connectBtn) connectBtn.addEventListener("click", connectWallet);

  const loadSepolia = document.getElementById("loadSepoliaPair");
  if(loadSepolia) loadSepolia.addEventListener("click", ()=>loadLPData("sepolia"));

  const loadBsc = document.getElementById("loadBscPair");
  if(loadBsc) loadBsc.addEventListener("click", ()=>loadLPData("bscTestnet"));
});
