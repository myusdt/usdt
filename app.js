// =============================
// MYUSDT Dashboard JS
// =============================

// CONFIGURATION
const RPCS = {
  sepolia: "https://sepolia.infura.io/v3/afc846803e384cc583a4a260f693cd71",
  bscTestnet: "https://data-seed-prebsc-1-s1.binance.org:8545/"
};

const PAIRS = {
  sepolia: "0x64be8fb20f5e6217D4D7B90ddca515F96B3A86fe",
  bscTestnet: "0x0c39D41371D397d8172024c097c0B69E88788160"
};

const TOKENS = {
  sepolia: { MYUSDT: "0xc6C465b8E56757DB8dC54D7E11D0194182FEB475" },
  bscTestnet: { MYUSDT: "0x1c7e5094413Be138C1561D05c2Be92364d74b5b2" }
};

const BRIDGE = {
  locker: "0xe5b80EF9bCb9F98E79A8490D51424797BD882b26", // Sepolia
  minter: "0x0052338C058D1D29690ecf90f56f5cCc45E250be"  // BSC Testnet
};

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from,address indexed to,uint256 value)"
];

const LP_ABI = [
  "function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// UTILITY
function formatBalance(balance, decimals=18){ 
  return (Number(balance)/10**decimals).toFixed(4); 
}

// -----------------------------
// WALLET CONNECTION
// -----------------------------
async function connectWallet(){
  if (!window.ethereum) {
    alert("MetaMask is required!");
    return;
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const userAddress = accounts[0];
  document.getElementById("walletAddress").innerText = userAddress;
  return userAddress;
}

// -----------------------------
// LOAD TOKEN DATA
// -----------------------------
async function loadTokenData(chain="sepolia") {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPCS[chain]);
    const token = new ethers.Contract(TOKENS[chain].MYUSDT, ERC20_ABI, provider);

    const supply = await token.totalSupply();
    const totalSupplyEl = document.getElementById("totalSupply");
    if(totalSupplyEl) totalSupplyEl.innerText = formatBalance(supply);

    if(window.ethereum) {
      const userProvider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = userProvider.getSigner();
      const user = await signer.getAddress();
      const bal = await token.balanceOf(user);
      const userBalanceEl = document.getElementById("userBalance");
      if(userBalanceEl) userBalanceEl.innerText = formatBalance(bal);
    }
  } catch (err) { console.error(err); }
}

// -----------------------------
// LOAD LP DATA
// -----------------------------
async function loadLPData(chain) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPCS[chain]);
    const pair = new ethers.Contract(PAIRS[chain], LP_ABI, provider);
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    const text = `Token0: ${token0}\nToken1: ${token1}\nReserves: ${reserves[0]} / ${reserves[1]}`;
    if(chain === "sepolia") document.getElementById("uniReserves").innerText = text;
    if(chain === "bscTestnet") document.getElementById("pancakeReserves").innerText = text;
  } catch (err) {
    console.error(err);
  }
}

// -----------------------------
// LOAD BRIDGE EVENTS
// -----------------------------
async function loadBridgeStatus() {
  try {
    const providerSepolia = new ethers.providers.JsonRpcProvider(RPCS.sepolia);
    const providerBsc = new ethers.providers.JsonRpcProvider(RPCS.bscTestnet);

    const locker = new ethers.Contract(BRIDGE.locker, ERC20_ABI, providerSepolia);
    const minter = new ethers.Contract(BRIDGE.minter, ERC20_ABI, providerBsc);

    const sepoEvents = await locker.queryFilter("Transfer", -5000);
    const bscEvents = await minter.queryFilter("Transfer", -5000);

    const lastSepo = sepoEvents[sepoEvents.length-1];
    const lastBsc = bscEvents[bscEvents.length-1];

    let text = "Sepolia Last Transfer:\n";
    text += lastSepo ? `${lastSepo.args.from} → ${lastSepo.args.to}, ${formatBalance(lastSepo.args.value)}\n\n` : "None\n\n";
    text += "BSC Testnet Last Transfer:\n";
    text += lastBsc ? `${lastBsc.args.from} → ${lastBsc.args.to}, ${formatBalance(lastBsc.args.value)}\n` : "None";

    const statusEl = document.getElementById("bridgeStatus");
    if(statusEl) statusEl.innerText = text;
  } catch (err) {
    console.error("Bridge error:", err);
  }
}

// -----------------------------
// AUTO + MANUAL REFRESH
// -----------------------------
function setupAutoRefresh(){
  setInterval(()=>{
    loadTokenData("sepolia");
    loadTokenData("bscTestnet");
    loadLPData("sepolia");
    loadLPData("bscTestnet");
    loadBridgeStatus();
    const ts = document.getElementById("last-updated");
    if(ts) ts.innerText = `Last updated: ${new Date().toLocaleString()}`;
  }, 30000);
}

// -----------------------------
// INITIALIZE
// -----------------------------
window.addEventListener("load", async ()=>{
  const connectBtn = document.getElementById("connectBtn");
  if(connectBtn) connectBtn.addEventListener("click", connectWallet);

  const refreshBtn = document.getElementById("refresh-btn");
  if(refreshBtn) refreshBtn.addEventListener("click", ()=>{
    loadTokenData("sepolia");
    loadTokenData("bscTestnet");
    loadLPData("sepolia");
    loadLPData("bscTestnet");
    loadBridgeStatus();
  });

  const refreshUni = document.getElementById("refreshUni");
  if(refreshUni) refreshUni.addEventListener("click", ()=>loadLPData("sepolia"));

  const refreshPancake = document.getElementById("refreshPancake");
  if(refreshPancake) refreshPancake.addEventListener("click", ()=>loadLPData("bscTestnet"));

  const refreshBridge = document.getElementById("refreshBridge");
  if(refreshBridge) refreshBridge.addEventListener("click", loadBridgeStatus);

  // initial loads
  await loadTokenData("sepolia");
  await loadTokenData("bscTestnet");
  await loadLPData("sepolia");
  await loadLPData("bscTestnet");
  await loadBridgeStatus();

  setupAutoRefresh();
});
