const { expect } = require("chai");
const { ethers } = require("hardhat");
const { tokenInfo, mintSig } = require("./variables");

const verifiers = ["0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1"];
const digest =
  "0x1ba8c6b69327b90766d956e6bad61f7af0de4529177154050a64de24f1936c21";

// contract instance
let tokens;
let zCloakSBT;

// signer
const attesterWallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC_ALICE);
const attester_addr = ethers.utils;
const attester = attesterWallet.connect(ethers.provider);

describe("Full Zksbt Flow Test Case", () => {
  // zCloakSBT contract constructor args
  beforeEach(async () => {
    tokens = await ethers.deployContract("Tokens");
    zCloakSBT = await ethers.deployContract("zCloakSBT", [verifiers], {
      libraries: {
        Tokens: tokens.address,
      },
    });
  });

  it("should success if user executes mint logic", async () => {
    // console.log(await zCloakSBT.CHAIN_ID());
    // console.log(await zCloakSBT.DOMAIN_SEPARATOR());
    // console.log();

    // toggle mint on
    expect(await zCloakSBT.mintOpen()).equal(false);
    await zCloakSBT.toggleMinting();
    expect(await zCloakSBT.mintOpen()).equal(true);

    // set assertionMethodKey first
    await zCloakSBT.setAssertionMethod(
      "0x361F1dd3db9037d2aC39f84007DC65dfA8BD248E"
    );
    console.log("the check verifier contract1 is :", zCloakSBT.address);

    await expect(
      zCloakSBT.mint(
        [
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0x1209c3865ae4631cceacfbb3d4a946fec4ff97d3c7454a0383cb7e26b0bb8189",
          "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872",
          "0x1ba8c6b69327b90766d956e6bad61f7af0de4529177154050a64de24f1936c21",
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0x57E7b664aaa7C895878DdCa5790526B9659350Ec",
          "0xa854b8d4aaf7f2ad1bce98f28a63c06821938955f19b7a1bfd4ca43dca88231e3f6cea6107c218a542b4ef66bc3852ffd7d0a3209f449de79a8909973d3eed2b00",
          [8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          1683875180311,
          0,
          "0x0001",
          "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ",
        ],
        "0x5f9a79b39c35c6bcc5b5af63737e40d4d09255cf86aa3c2a5ffd6a96afca431765718a83071747a9e1e634367d0013145c23aa7cb7cdb02b7a3da0630cfcf08401"
      )
    ).emit(zCloakSBT, "MintSuccess");
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
    console.log("the check verifier contract2 is :", zCloakSBT.address);
    await zCloakSBT.toggleMinting();

    await zCloakSBT.setAssertionMethod(
      "0x361F1dd3db9037d2aC39f84007DC65dfA8BD248E"
    );

    await zCloakSBT.mint(tokenInfo, mintSig);

    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      false
    );
    await expect(
      zCloakSBT.revokeByDigest(
        "0x1ba8c6b69327b90766d956e6bad61f7af0de4529177154050a64de24f1936c21"
      )
    ).emit(zCloakSBT, "RevokeSuccess");

    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      true
    );
  });

  // it("should success if set binding", async () => {});

  // it("should success if unbinding", async () => {});

  // // it("should success if check token valid", async () => {
  // //   // mint first
  // //   await zCloakSBT.mint(tokenInfo, mintSig);
  // //   expect(await zCloakSBT.balanceOf(deployer.address)).to.equal(1);

  // //   // _exist()
  // //   expect(await zCloakSBT.checkTokenExist(1)).to.equal(true);

  // //   // expirationTimestamp
  // //   // TODO:
  // // });

  it("Check Verifier Signature", async () => {
    console.log(await zCloakSBT.CHAIN_ID());
    console.log(await zCloakSBT.DOMAIN_SEPARATOR());
    console.log("the check verifier contract is :", zCloakSBT.address);
    await zCloakSBT.toggleMinting();

    // console.log(await ethers.getSigner())
    await zCloakSBT.setAssertionMethod(
      "0x361F1dd3db9037d2aC39f84007DC65dfA8BD248E"
    );

    await expect(
      zCloakSBT.mint(
        [
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0x1209c3865ae4631cceacfbb3d4a946fec4ff97d3c7454a0383cb7e26b0bb8189",
          "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872",
          "0x1ba8c6b69327b90766d956e6bad61f7af0de4529177154050a64de24f1936c21",
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0x57E7b664aaa7C895878DdCa5790526B9659350Ec",
          "0xa854b8d4aaf7f2ad1bce98f28a63c06821938955f19b7a1bfd4ca43dca88231e3f6cea6107c218a542b4ef66bc3852ffd7d0a3209f449de79a8909973d3eed2b00",
          [8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          1683875180311,
          0,
          "0x0001",
          "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ",
        ],
        "0x8f5c3953eab4238d8507589fe429300a43c96c8b5c83be6cb0c942838af207f67658c85ea0d10d1103b10ec4cc15aab4e22eaaba715422035bd6dd218de76e4101"
      )
    ).emit(zCloakSBT, "MintSuccess");
    // Wait for it to be mined.
  });
});
