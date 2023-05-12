const { expect } = require("chai");
const { ethers } = require("hardhat");
const { tokenInfo } = require("./variables");

const verifiers = ["0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1"];
const digest =
  "0x04535f0e6831895fe49e8719319f8073ff49d0e653d0a7a37f290b9f4540765d";

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
    // console.log( "the address is ", await ethers.getSigner());

    // toggle mint on
    expect(await zCloakSBT.mintOpen()).equal(false);
    await zCloakSBT.toggleMinting();
    expect(await zCloakSBT.mintOpen()).equal(true);

    // set assertionMethodKey first
    await zCloakSBT.setAssertionMethod(
      "0x9eF88b8749B7E5a0E2deA5dD10c9939565D2D215"
    );
    console.log("the check verifier contract1 is :", zCloakSBT.address);

    await expect(
      zCloakSBT.mint(
        [
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0x5f0d91707ce8e3e252f433b9d6c611fa8851c99c6f359f5b604cd0b8c8d355a7",
          "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872",
          "0xe6a3fcdff048e876c22c9503b31442dc6a35ba82c50178fcfdd688f2df12bd28",
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563",
          "0x9b43f8dc281abd550dbaa65396b76c0e7dc200498cae929ba858df8d132af43a7d2accdd1b8746d9fb2f2c76071c9174e7f17d95f9709610b15e66e5a687349601",
          [8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          1683909331084,
          0,
          "0x0001",
          "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ",
        ],
        "0x64647c9eb72d4bf6ceeaee93956fe2fd9cc14471b3e753625d8c5aac531b02a01dc942f9ba0091e02621cfab44c08ceba91ba9f867f39d947c30efac87e1c3fe00"
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
      "0x9eF88b8749B7E5a0E2deA5dD10c9939565D2D215"
    );

    await zCloakSBT.mint(
      [
        "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
        "0x5f0d91707ce8e3e252f433b9d6c611fa8851c99c6f359f5b604cd0b8c8d355a7",
        "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872",
        "0xe6a3fcdff048e876c22c9503b31442dc6a35ba82c50178fcfdd688f2df12bd28",
        "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
        "0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563",
        "0x9b43f8dc281abd550dbaa65396b76c0e7dc200498cae929ba858df8d132af43a7d2accdd1b8746d9fb2f2c76071c9174e7f17d95f9709610b15e66e5a687349601",
        [8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        1683909331084,
        0,
        "0x0001",
        "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ",
      ],
      "0xba388484555396e3381be04441addd7fd11a4382525d01a5b1620e8868c3b9dc4b138172aa9a5409d00da1a500953c0c1010e8643b360d2adffacd9cfa941ec601"
    );

    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      false
    );
    await expect(
      zCloakSBT.revokeByDigest(
        "0x04535f0e6831895fe49e8719319f8073ff49d0e653d0a7a37f290b9f4540765d"
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
      "0x9eF88b8749B7E5a0E2deA5dD10c9939565D2D215"
    );

    await expect(
      zCloakSBT.mint(
        [
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0x5f0d91707ce8e3e252f433b9d6c611fa8851c99c6f359f5b604cd0b8c8d355a7",
          "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872",
          "0xe6a3fcdff048e876c22c9503b31442dc6a35ba82c50178fcfdd688f2df12bd28",
          "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
          "0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563",
          "0x9b43f8dc281abd550dbaa65396b76c0e7dc200498cae929ba858df8d132af43a7d2accdd1b8746d9fb2f2c76071c9174e7f17d95f9709610b15e66e5a687349601",
          [8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          1683909331084,
          0,
          "0x0001",
          "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ",
        ],
        "0x91ac5605e38b74b7dce88b4e0117d37c2698a35e6fcf7eb326818b808a4cb260084cd934a40ad19d87ad4868b9a6902635731944aada0e83c256ec4baa47cdf300"
      )
    ).emit(zCloakSBT, "MintSuccess");
    // Wait for it to be mined.
  });
});
