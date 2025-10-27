// scripts/checkBalanceAndNetwork.js
const { ethers } = require("hardhat");

const LINK_TOKEN_SEPOLIA = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Chainlink test LINK on Sepolia

async function main() {
  console.log("🔍 Checking Sepolia network connection...\n");

  // Fetch network info
  const network = await ethers.provider.getNetwork();
  console.log(`🪐 Connected Network: ${network.name || "Unknown"} (${network.chainId})`);

  // Fetch signer
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  console.log(`👤 Deployer address: ${address}`);

  // Fetch ETH balance
  const balance = await ethers.provider.getBalance(address);
  console.log(`💰 ETH Balance: ${ethers.formatEther(balance)} ETH`);

  // Fetch LINK balance (ERC20)
  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)"
  ];
  const link = new ethers.Contract(LINK_TOKEN_SEPOLIA, abi, ethers.provider);

  const linkSymbol = await link.symbol();
  const linkBalance = await link.balanceOf(address);

  console.log(`🔗 LINK Balance: ${ethers.formatUnits(linkBalance, 18)} ${linkSymbol}`);

  console.log("\n✅ Everything looks good!");
}

main().catch((err) => {
  console.error("❌ Error checking balances:", err);
  process.exitCode = 1;
});
