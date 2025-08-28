// =============================
// Token Dashboard Frontend Logic
// =============================

// 🔌 RPC URLs (using HTTPS, no .env on frontend!)
const RPCS = {
  sepolia: "https://sepolia.infura.io/v3/afc846803e384cc583a4a260f693cd71",
  bscTestnet: "https://data-seed-prebsc-1-s1.binance.org:8545/"
};

// 📜 Token + LP Contract Config
const CONFIG = {
  token: {
    name: "MYUSDT",
    symbol: "MYUSDT",
    decimals: 18,
    totalSupply: 1000
  },
  contracts: {
    sepolia: "0xc6C465b8E56757DB8dC54D7E11D0194182FEB475",   // Sepolia token contract
    bscTestnet: "0x1c7e5094413Be138C1561D05c2Be92364d74b5b2", // BSC Testnet token contract
    vault: "0xb75598a18D6A4eA87769f680F2264AF6f0E61f64"       // Example vault address
  },
  uniswap: {
    routerSepolia: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
    wethSepolia: "0xFFF9976782d46cC05630D1f6eAbbacb8c2324d6b"
  },
  pancake: {
    routerTestnet: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
    wbnbTestnet: "0xae13d989dac2f0debff460ac112a837c89baa7cd"
  }
};

// 🛠 ERC20 ABI (minimal for balances + supply)
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

// 🌊 Uniswap/Pancake LP ABI (for reserves)
const LP_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// ethers.js global
let ethersProvider = {};

// Connect providers
for (let net in RPCS) {
  ethersProvider[net] = new ethers.providers.JsonRpcProvider(RPCS[net]);
}

// =============================
// 📊 Dashboard Functions
// =============================

// Load token supply + vault balances
async function loadTokenData() {
  try {
    // Sepolia Token
    const tokenSepolia = new ethers.Contract(CONFIG.contracts.sepolia, ERC20_ABI, ethersProvider.sepolia);
    const supplySepolia = await tokenSepolia.totalSupply();
    document.getElementById("supply-sepolia").innerText =
      ethers.utils.formatUnits(supplySepolia, CONFIG.token.decimals);

    // BSC Testnet Token
    const tokenBsc = new ethers.Contract(CONFIG.contracts.bscTestnet, ERC20_ABI, ethersProvider.bscTestnet);
    const supplyBsc = await tokenBsc.totalSupply();
    document.getElementById("supply-bsc").innerText =
      ethers.utils.formatUnits(supplyBsc, CONFIG.token.decimals);

    // Vault Balance on Sepolia
    const vaultBalanceSepolia = await tokenSepolia.balanceOf(CONFIG.contracts.vault);
    document.getElementById("vault-sepolia").innerText =
      ethers.utils.formatUnits(vaultBalanceSepolia, CONFIG.token.decimals);

    // Vault Balance on BSC
    const vaultBalanceBsc = await tokenBsc.balanceOf(CONFIG.contracts.vault);
    document.getElementById("vault-bsc").innerText =
      ethers.utils.formatUnits(vaultBalanceBsc, CONFIG.token.decimals);

  } catch (err) {
    console.error("Error loading token data:", err);
  }
}

// Load LP reserves (Uniswap + Pancake)
async function loadLPData() {
  try {
    // Example: Uniswap LP on Sepolia
    // (you will later replace with actual LP pair address once created)
    const lpSepolia = new ethers.Contract("0x0000000000000000000000000000000000000000", LP_ABI, ethersProvider.sepolia);
    // const { reserve0, reserve1 } = await lpSepolia.getReserves();
    // document.getElementById("lp-sepolia").innerText = `Reserves: ${reserve0} / ${reserve1}`;

    // Example: Pancake LP on BSC Testnet
    const lpBsc = new ethers.Contract("0x0000000000000000000000000000000000000000", LP_ABI, ethersProvider.bscTestnet);
    // const { reserve0: r0, reserve1: r1 } = await lpBsc.getReserves();
    // document.getElementById("lp-bsc").innerText = `Reserves: ${r0} / ${r1}`;

    document.getElementById("lp-sepolia").innerText = "LP tracking will activate once pool is created.";
    document.getElementById("lp-bsc").innerText = "LP tracking will activate once pool is created.";

  } catch (err) {
    console.error("Error loading LP data:", err);
  }
}

// =============================
// 🚀 Init
// =============================
window.addEventListener("load", async () => {
  await loadTokenData();
  await loadLPData();
});
