// scripts/deploy.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  console.log(`🚀 Deploying contracts with account: ${deployer.address} on network: ${network}`);

  const MyToken = await ethers.getContractFactory("MyToken");

  // ✅ Pass constructor args as an array for Ethers v6 compatibility
  const myToken = await MyToken.deploy([deployer.address]);
  await myToken.waitForDeployment();

  const contractAddress = await myToken.getAddress();
  console.log(`✅ MyToken deployed to: ${contractAddress}`);

  // Load ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ERC20.sol/MyToken.json");
  const abi = JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;

  // Metadata
  const newDeployment = {
    contract: "MyToken",
    address: contractAddress,
    network,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    abi,
  };

  // Ensure /deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

  const filePath = path.join(deploymentsDir, `deployed-contracts.${network}.json`);
  let deployments = [];

  if (fs.existsSync(filePath)) {
    deployments = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  deployments.push(newDeployment);
  fs.writeFileSync(filePath, JSON.stringify(deployments, null, 2));

  console.log(`📁 Deployment saved: ${filePath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
