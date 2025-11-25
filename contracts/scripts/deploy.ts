import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TestToken
  console.log("\n1. Deploying TestToken...");
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("✓ TestToken deployed to:", testTokenAddress);

  // Deploy MaliciousContract
  console.log("\n2. Deploying MaliciousContract...");
  const MaliciousContract = await ethers.getContractFactory("MaliciousContract");
  const maliciousContract = await MaliciousContract.deploy();
  await maliciousContract.waitForDeployment();
  const maliciousAddress = await maliciousContract.getAddress();
  console.log("✓ MaliciousContract deployed to:", maliciousAddress);

  // Deploy UpgradeableToken
  console.log("\n3. Deploying UpgradeableToken...");
  const UpgradeableToken = await ethers.getContractFactory("UpgradeableToken");
  const upgradeableToken = await UpgradeableToken.deploy();
  await upgradeableToken.waitForDeployment();
  const upgradeableAddress = await upgradeableToken.getAddress();
  console.log("✓ UpgradeableToken deployed to:", upgradeableAddress);

  // Initialize upgradeable token
  await upgradeableToken.initialize();
  console.log("✓ UpgradeableToken initialized");

  // Deploy SimpleSwap
  console.log("\n4. Deploying SimpleSwap...");
  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  const swapAddress = await simpleSwap.getAddress();
  console.log("✓ SimpleSwap deployed to:", swapAddress);

  // Create a liquidity pool
  console.log("\n5. Creating test liquidity pool...");
  const createPoolTx = await simpleSwap.createPool(testTokenAddress, ethers.ZeroAddress);
  await createPoolTx.wait();
  console.log("✓ Pool created");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("TestToken:", testTokenAddress);
  console.log("MaliciousContract:", maliciousAddress);
  console.log("UpgradeableToken:", upgradeableAddress);
  console.log("SimpleSwap:", swapAddress);
  console.log("=".repeat(60));
  console.log("\nSave these addresses to test the extension!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
