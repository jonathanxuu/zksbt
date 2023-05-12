const { expect } = require("chai");
const { ethers } = require("hardhat");
const { tokenInfo, mintSig } = require("./variables");

describe("Full Zksbt Flow Test Case", () => {
  // zCloakSBT contract constructor args
  const verifiers = ["0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1"];
  const digest =
    "0x0c240bce4ce46341ed63bef97a701881317f381770cab2edf6fe17c4fa547214";

  // contract instance
  let tokens;
  let zCloakSBT;

  // signer
  const attesterWallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC_ALICE);
  const attester = attesterWallet.connect(ethers.provider);

  before(async () => {
    tokens = await ethers.deployContract("Tokens");
    zCloakSBT = await ethers.deployContract("zCloakSBT", [verifiers], {
      libraries: {
        Tokens: tokens.address,
      },
    });
  });

  it("should success if user executes mint logic", async () => {
    console.log(await zCloakSBT.CHAIN_ID());
    console.log(await zCloakSBT.DOMAIN_SEPARATOR());
    console.log(zCloakSBT.address);
    console.log();

    // toggle mint on
    expect(await zCloakSBT.mintOpen()).equal(false);
    await zCloakSBT.toggleMinting();
    expect(await zCloakSBT.mintOpen()).equal(true);

    await expect(zCloakSBT.mint(tokenInfo, mintSig))
      .to.emit(zCloakSBT, "MintSuccess")
      .withArgs("0x57E7b664aaa7C895878DdCa5790526B9659350Ec", 1);
  });

  it("should success if deployer adds new verifiers", async () => {
    let testVerifiers = [
      "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
      "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    ];

    expect(await zCloakSBT.checkVerifierWhitelist(verifiers[0])).to.equal(true);
    expect(await zCloakSBT.checkVerifierWhitelist(testVerifiers[0])).to.equal(
      false
    );
    expect(await zCloakSBT.checkVerifierWhitelist(testVerifiers[1])).to.equal(
      false
    );

    // deep equal with event filter
    const filter = zCloakSBT.filters.VerifierWhiteListAdd();
    zCloakSBT.on(filter, (modifiedVerifiers) => {
      expect(modifiedVerifiers).to.deep.equal(testVerifiers);
    });
    await zCloakSBT.modifyVerifierWhitelist(true, testVerifiers);
    zCloakSBT.off(filter);

    expect(await zCloakSBT.checkVerifierWhitelist(verifiers[0])).to.equal(true);
    expect(await zCloakSBT.checkVerifierWhitelist(testVerifiers[0])).to.equal(
      true
    );
    expect(await zCloakSBT.checkVerifierWhitelist(testVerifiers[1])).to.equal(
      true
    );
  });

  it("should success if deployer removes verifiers", async () => {
    expect(await zCloakSBT.checkVerifierWhitelist(verifiers[0])).to.equal(true);

    const filter = zCloakSBT.filters.VerifierWhiteListDelete();
    zCloakSBT.on(filter, (modifiedVerifiers) => {
      expect(modifiedVerifiers).to.deep.equal(verifiers);
    });
    await zCloakSBT.modifyVerifierWhitelist(false, verifiers);
    zCloakSBT.off(verifiers);

    expect(await zCloakSBT.checkVerifierWhitelist(verifiers[0])).to.equal(
      false
    );
  });

  it("should success if attester burn(revoke) SBT by digest", async () => {
    // transfer some money to attester for paying gas
    const [deployer] = await ethers.getSigners();
    const transferTx = await deployer.sendTransaction({
      to: attester.address,
      value: ethers.utils.parseEther("10.0"),
    });
    await transferTx.wait();
    expect(ethers.utils.formatEther(await attester.getBalance())).to.equal(
      "10"
    );

    // deployer mint first
    await zCloakSBT.mint(tokenInfo, mintSig);
    expect(await zCloakSBT.balanceOf(deployer.address)).to.equal(1);

    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      false
    );
    await expect(
      zCloakSBT
        .connect(attester)
        .revokeByDigest(
          "0x0c240bce4ce46341ed63bef97a701881317f381770cab2edf6fe17c4fa547214"
        )
    )
      .to.emit(zCloakSBT, "RevokeSuccess")
      .withArgs(attester.address, [1]);
    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      true
    );
    expect(await zCloakSBT.balanceOf(deployer)).to.equal(0);
  });

  it("should success if set binding", async () => {});

  it("should success if unbinding", async () => {});

  it("should success if check token valid", async () => {
    // mint first
    // _exist()
    // expirationTimestamp
  });
});
