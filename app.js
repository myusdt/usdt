// =============================
// 🚀 MYUSDT Multi-Chain Dashboard
// =============================

// 🔌 RPC URLs (frontend-safe, no .env)
const RPCS = {
  sepolia: "https://sepolia.infura.io/v3/afc846803e384cc583a4a260f693cd71",
  bscTestnet: "https://data-seed-prebsc-1-s1.binance.org:8545/"
};

// 📜 Token + LP Config (single source of truth)
const CONFIG = {
  token: {
    name: "MYUSDT",
    symbol: "MYUSDT",
    decimals: 18
  },
  contracts: {
    sepolia: "0xc6C465b8E56757DB8dC54D7E11D0194182FEB475",   // Sepolia token
    bscTestnet: "0x1c7e5094413Be138C1561D05c2Be92364d74b5b2", // BSC Testnet token
    vault: "0xb75598a18D6A4eA87769f680F2264AF6f0E61f64"       // Vault
  },
  lp: {
    sepolia: "0x0000000000000000000000000000000000000000",    // Replace with actual Uniswap LP
    bscTestnet: "0x0000000000000000000000000000000000000000"  // Replace with actual Pancake LP
  }
};

// 🛠 Minimal ERC20 ABI
const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

// 🌊 LP ABI
const LP_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
];

// 🔗 Providers (auto-built from RPC list)
const ethersProvider = {};
for (const [net, url] of Object.entries(RPCS)) {
  ethersProvider[net] = new ethers.providers.JsonRpcProvider(url);
}

// =============================
// 📊 Dashboard Functions
// =============================

// Load token + vault balances
async function loadTokenData() {
  try {
    for (const [network, contractAddress] of Object.entries(CONFIG.contracts)) {
      if (network === "vault") continue; // Skip vault itself

      const token = new ethers.Contract(contractAddress, ERC20_ABI, ethersProvider[network]);

      const [supply, vaultBalance] = await Promise.all([
        token.totalSupply(),
        token.balanceOf(CONFIG.contracts.vault)
      ]);

      document.getElementById(`supply-${network}`).innerText =
        ethers.utils.formatUnits(supply, CONFIG.token.decimals);

      document.getElementById(`vault-${network}`).innerText =
        ethers.utils.formatUnits(vaultBalance, CONFIG.token.decimals);
    }
  } catch (err) {
    console.error("❌ Error loading token data:", err);
  }
}

// Load LP reserves
async function loadLPData() {
  try {
    for (const [network, lpAddress] of Object.entries(CONFIG.lp)) {
      const element = document.getElementById(`lp-${network}`);

      if (!element) continue; // Skip if no element in HTML

      if (!lpAddress || lpAddress === "0x0000000000000000000000000000000000000000") {
        element.innerText = "LP not deployed yet.";
        continue;
      }

      const lp = new ethers.Contract(lpAddress, LP_ABI, ethersProvider[network]);
      const { reserve0, reserve1 } = await lp.getReserves();

      element.innerText = `Reserves: ${ethers.utils.formatUnits(reserve0, CONFIG.token.decimals)} / ${ethers.utils.formatUnits(reserve1, CONFIG.token.decimals)}`;
    }
  } catch (err) {
    console.error("❌ Error loading LP data:", err);
  }
}

// Show "Last Updated" timestamp
function updateTimestamp() {
  const ts = new Date().toLocaleString();
  document.getElementById("last-updated").innerText = `Last Updated: ${ts}`;
}

// =============================
// 🚀 Init Dashboard
// =============================
async function initDashboard() {
  await loadTokenData();
  await loadLPData();
  updateTimestamp();
}

// Manual refresh handler
function manualRefresh() {
  initDashboard();
}

// Refresh every 30s for live data
window.addEventListener("load", () => {
  initDashboard();
  setInterval(initDashboard, 30_000);

  // Attach refresh button if exists
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", manualRefresh);
  }
});
