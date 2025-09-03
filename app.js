// =============================
// MYUSDT Dashboard JS (Mainnet)
// =============================

// CONFIGURATION
const RPCS = {
  ethereum: "https://mainnet.infura.io/v3/afc846803e384cc583a4a260f693cd71",
  bsc: "https://bsc-dataseed.binance.org/"
};

const PAIRS = {
  ethereum: "0xbDAbc9E735848EF2E95a45A08c7AFDF39708Ef14", // MYUSDT/WETH
  bsc: "0x0bD7b3cB7B9b4cF7E8C0Bf3f4BfE9E1cB6f4eC1B"      // MYUSDT/WBNB
};

const TOKENS = {
  ethereum: { MYUSDT: "0x833D07dF94656A0e1633E3F155d10C45366A3Ea2" },
  bsc: { MYUSDT: "0x5ff19C505CCA2fa457cBd060f0CB5473C8400E70" }
};

const BRIDGE = {
  locker: "0xe5b80EF9bCb9F98E79A8490D51424797BD882b26", // Ethereum Mainnet
  minter: "0x0052338C058D1D29690ecf90f56f5cCc45E250be"  // BSC Mainnet
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
function formatBalance(balance, decimals = 18) {
  if (!balance) return "0";
  const bn = ethers.BigNumber.from(balance.toString());
  const divisor = ethers.BigNumber.from(10).pow(decimals);
  const whole = bn.div(divisor).toString();
  const fraction = bn.mod(divisor).toString().padStart(decimals, "0").slice(0, 4);
  return `${whole}.${fraction}`;
}

// -----------------------------
// WALLET CONNECTION
// -----------------------------
async function connectWallet() {
  if (window.ethereum && window.ethereum.isMetaMask) {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];
    document.getElementById("walletAddress").innerText = userAddress;
    return userAddress;
  } else {
    alert("Please install MetaMask!");
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const userAddress = accounts[0];
  document.getElementById("walletAddress").innerText = userAddress;
  return userAddress;
}

// -----------------------------
// LOAD TOKEN DATA
// -----------------------------
async function loadTokenData(chain="ethereum") {
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
    if(chain === "ethereum") document.getElementById("uniReserves").innerText = text;
    if(chain === "bsc") document.getElementById("pancakeReserves").innerText = text;
  } catch (err) {
    console.error(err);
  }
}

// -----------------------------
// LOAD BRIDGE EVENTS
// -----------------------------
async function loadBridgeStatus() {
  try {
    const providerEth = new ethers.providers.JsonRpcProvider(RPCS.ethereum);
    const providerBsc = new ethers.providers.JsonRpcProvider(RPCS.bsc);

    const locker = new ethers.Contract(BRIDGE.locker, ERC20_ABI, providerEth);
    const minter = new ethers.Contract(BRIDGE.minter, ERC20_ABI, providerBsc);

    const ethEvents = await locker.queryFilter("Transfer", 0, "latest");
    const bscEvents = await minter.queryFilter("Transfer", 0, "latest");

    const lastEth = ethEvents[ethEvents.length-1];
    const lastBsc = bscEvents[bscEvents.length-1];

    let text = "Ethereum Last Transfer:\n";
    text += lastEth ? `${lastEth.args.from} → ${lastEth.args.to}, ${formatBalance(lastEth.args.value)}\n\n` : "None\n\n";
    text += "BSC Last Transfer:\n";
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
    loadTokenData("ethereum");
    loadTokenData("bsc");
    loadLPData("ethereum");
    loadLPData("bsc");
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
    loadTokenData("ethereum");
    loadTokenData("bsc");
    loadLPData("ethereum");
    loadLPData("bsc");
    loadBridgeStatus();
  });

  const refreshUni = document.getElementById("refreshUni");
  if(refreshUni) refreshUni.addEventListener("click", ()=>loadLPData("ethereum"));

  const refreshPancake = document.getElementById("refreshPancake");
  if(refreshPancake) refreshPancake.addEventListener("click", ()=>loadLPData("bsc"));

  const refreshBridge = document.getElementById("refreshBridge");
  if(refreshBridge) refreshBridge.addEventListener("click", loadBridgeStatus);

  // initial loads
  await loadTokenData("ethereum");
  await loadTokenData("bsc");
  await loadLPData("ethereum");
  await loadLPData("bsc");
  await loadBridgeStatus();

  setupAutoRefresh();
});
