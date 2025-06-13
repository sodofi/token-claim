import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ClaimTokenModule = buildModule("ClaimTokenModule", (m) => {
  const claimToken = m.contract("ClaimToken");

  return { claimToken };
});

export default ClaimTokenModule; 