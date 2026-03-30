const hre = require("hardhat");

async function main() {
    const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
    const evidenceRegistry = await EvidenceRegistry.deploy();

    await evidenceRegistry.waitForDeployment();

    console.log("EvidenceRegistry deployed to:", await evidenceRegistry.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
