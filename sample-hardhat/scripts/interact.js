// scripts/interact.js
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const netName = network.name;
  const filePath = path.join(__dirname, `../deployments/deployed-contracts.${netName}.json`);
  const reportDir = path.join(__dirname, "../reports");
  const reportPath = path.join(reportDir, `interaction-report.${netName}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ No deployment file found for network: ${netName}`);
  }

  const deployments = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const latest = deployments[deployments.length - 1];

  const isLocal = ["localhost", "hardhat"].includes(netName);
  const isTestnet = ["sepolia", "goerli", "mumbai", "polygonZkEVMTestnet"].includes(netName);
  const isMainnet = ["mainnet", "ethereum"].includes(netName);

  console.log(`\n📡 Connected to: ${netName}`);
  console.log(`🔍 Network Type: ${isLocal ? "LOCAL" : isTestnet ? "TESTNET" : "MAINNET"}`);
  console.log(`   Contract: ${latest.contract}`);
  console.log(`   Address:  ${latest.address}`);
  console.log(`   Deployed: ${latest.timestamp}`);

  // Setup provider & signers
  const provider = ethers.provider;
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const user1 = signers[1] || ethers.Wallet.createRandom().connect(provider);
  const user2 = signers[2] || ethers.Wallet.createRandom().connect(provider);

  const token = await ethers.getContractAt(latest.contract, latest.address);

  // === Basic Info ===
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = Number(await token.decimals());
  const totalSupplyBefore = Number(ethers.formatEther(await token.totalSupply()));

  console.log("\n=== 🧩 TOKEN INFO ===");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", totalSupplyBefore, "MTK");

  const gasUsage = {}; // track gas for report

  // === TRANSFER ===
  console.log("\n💸 TRANSFER DEMO");
  try {
    const tx = await token.transfer(user1.address, ethers.parseEther("0.001"));
    const rc = await tx.wait();
    gasUsage.transfer = rc.gasUsed.toString();
    console.log(`✅ Transfer done (Gas used: ${gasUsage.transfer})`);
  } catch {
    gasUsage.transfer = "FAILED";
    console.warn("⚠️ Transfer failed (maybe access restricted).");
  }

  // === CONDITIONAL ACTIONS ===
  if (isLocal) {
    console.log("\n🧭 MINT DEMO (Local only)...");
    try {
      const tx = await token.mint(user2.address, ethers.parseEther("0.01"));
      const rc = await tx.wait();
      gasUsage.mint = rc.gasUsed.toString();
      console.log(`✅ Mint success. Gas used: ${gasUsage.mint}`);
    } catch {
      gasUsage.mint = "FAILED";
      console.warn("⚠️ Mint failed (not owner).");
    }

    console.log("\n👑 TRANSFER OWNERSHIP DEMO (Local only)...");
    try {
      const tx = await token.transferOwnership(user1.address);
      const rc = await tx.wait();
      gasUsage.transferOwnership = rc.gasUsed.toString();
      console.log(`✅ Ownership transferred to ${await token.owner()}`);
    } catch {
      gasUsage.transferOwnership = "FAILED";
      console.warn("⚠️ Ownership transfer failed.");
    }
  } else if (isTestnet) {
    console.log("\n🌐 Running in SAFE MODE (Testnet)");
    console.log("🛑 Minting and ownership transfers are disabled for safety.");
    gasUsage.mint = "DISABLED";
    gasUsage.transferOwnership = "DISABLED";
  } else if (isMainnet) {
    console.log("\n🚨 MAINNET DETECTED");
    console.log("🛑 Script will exit without executing unsafe operations.");
    return;
  }

  // === Final Balances ===
  const balOwner = ethers.formatEther(await token.balanceOf(owner.address));
  const balUser1 = ethers.formatEther(await token.balanceOf(user1.address));
  const balUser2 = ethers.formatEther(await token.balanceOf(user2.address));
  const totalSupplyAfter = ethers.formatEther(await token.totalSupply());

  console.log("\n=== 🧮 FINAL BALANCES ===");
  console.log(`Owner: ${balOwner} MTK`);
  console.log(`User1: ${balUser1} MTK`);
  console.log(`User2: ${balUser2} MTK`);
  console.log(`Total Supply: ${totalSupplyAfter} MTK`);

  const mode = isLocal ? "FULL" : isTestnet ? "SAFE" : "RESTRICTED";
  const timestamp = new Date().toISOString();

  // === STRUCTURED REPORT OBJECT ===
  const reportEntry = {
    timestamp,
    network: netName,
    mode,
    contract: latest.contract,
    address: latest.address,
    gasUsage,
    balances: {
      owner: balOwner,
      user1: balUser1,
      user2: balUser2,
    },
    totalSupplyBefore,
    totalSupplyAfter,
  };

  // === WRITE REPORT ===
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

  let report = [];
  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  }

  report.push(reportEntry);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n🧾 Interaction report saved to: ${reportPath}`);
  console.log("✅ Interaction flow completed successfully.");
}

main().catch((err) => {
  console.error("❌ Interaction failed:", err);
  process.exitCode = 1;
});
