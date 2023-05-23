const { expect } = require("chai");
const { ethers } = require("hardhat");

const verifiers = ["0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1"];

const recipient = "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1";
const ctype =
  "0xdc1bd26d1c5ae95fe5d74667e3f1b557c5bf179c512dcb7d9cc4365428c23756";
const programHash =
  "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872";
const digest =
  "0x53052d8675667d8b03b4c3a246e8006ea613d4e2877170e0b70e243dcb4a28a4";
const attesterSignature =
  "0x3d8c8437564aac727281065961dbe08d7e3079ab86639742289a09acc317e3403b243852da3dee565369925166a55771b5665a41c630165c2df468acd1aa556100";
const output = [8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const issuanceTimestamp = 1683909331084;
const expirationTimestamp = 0;
const vcVersion = "0x0001";
const sbtLink = "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ";

// contract instance
let tokens;
let zCloakSBT;

// signer
const attesterWallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC_ALICE);
const attester = attesterWallet.connect(ethers.provider);
const assertionMethod = "0x9eF88b8749B7E5a0E2deA5dD10c9939565D2D215";
// addr: 0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563

const tokenInfo = [
  recipient,
  ctype,
  programHash,
  digest,
  verifiers[0],
  attester.address,
  attesterSignature,
  output,
  issuanceTimestamp,
  expirationTimestamp,
  vcVersion,
  sbtLink,
];

describe("Mint Logic Error Test Case", () => {
  beforeEach(async () => {
    tokens = await ethers.deployContract("Tokens");
    zCloakSBT = await ethers.deployContract("zCloakSBT", [verifiers], {
      libraries: {
        Tokens: tokens.address,
      },
    });
  });

  it("Should success if execute the mint logic correctly", async () => {
    // console.log(`zCloakSBT addr: ${zCloakSBT.address}`);
    const verifierSignature =
      "0xab6d5133e557647f446cc49e44f3bd094190f3f26d79f9449831cde37b8fa2b2705961a16dbcb1930f6e23b268a894f395615dcc9363cf57047b9a7a2a390e2501";
    await zCloakSBT.toggleMinting();
    await zCloakSBT.setAssertionMethod(assertionMethod);
    expect(await zCloakSBT.checkAssertionMethod(attester.address)).to.equal(
      assertionMethod
    );
    await zCloakSBT.mint(tokenInfo, verifierSignature);
  });

  it("Should revert with 'MintDisabled'", async () => {
    // console.log(`zCloakSBT Addr: ${zCloakSBT.address}`);
    const verifierSignature =
      "0x6733ac59d2fcbded93a200fe49586558c02f8a8a21169c04fc5184b2e21119b43d2e893cd4f52f6d104cbfc2740a10152a7e86bdcf92041b3827a8143d63f03f00";
    expect(await zCloakSBT.mintOpen()).to.equal(false);
    await expect(
      zCloakSBT.mint(tokenInfo, verifierSignature)
    ).to.be.revertedWithCustomError(zCloakSBT, "MintDisabled");
  });

  it("Should revert with 'VCAlreadyExpired'", async () => {
    // console.log(`zCloakSBT Addr: ${zCloakSBT.address}`);
    const tokenInfoTest = [
      recipient,
      ctype,
      programHash,
      digest,
      verifiers[0],
      attester.address,
      attesterSignature,
      output,
      issuanceTimestamp,
      1684221271000,
      vcVersion,
      sbtLink,
    ];

    const verifierSignature =
      "0x0ecc4c06883e05f531f0d6eda08b02b630f9208d6154a9c4f1ee434977d2071971ab561a26c43fbb0cb4c9ca8b21a98515380712aca6ba47d4546b50f28adef800";

    await zCloakSBT.toggleMinting();
    expect(await zCloakSBT.mintOpen()).to.equal(true);
    await zCloakSBT.setAssertionMethod(
      "0x9eF88b8749B7E5a0E2deA5dD10c9939565D2D215"
    );
    await expect(
      zCloakSBT.mint(tokenInfoTest, verifierSignature)
    ).to.be.revertedWithCustomError(zCloakSBT, "VCAlreadyExpired");
  });

  it("Should revert with 'AttesterSignatureInvalid' if user not set assertion method", async () => {
    // console.log(`zCloakSBT Addr: ${zCloakSBT.address}`);
    // open mint toggle first
    await zCloakSBT.toggleMinting();
    expect(await zCloakSBT.mintOpen()).to.equal(true);

    // attester not set assertionMethod
    expect(await zCloakSBT.checkAssertionMethod(attester.address)).to.equal(
      await zCloakSBT.getBlankAddress()
    );

    const verifierSignature =
      "0xb99e2b513605f3f7dc87df74b93f7d698630e78e0b6c9869d12e868d173047f433f7f16dfc6c17882bbd6de488680c696f85a63f4d04fd3ba3ed570e54f7c5ff01";
    await expect(
      zCloakSBT.mint(tokenInfo, verifierSignature)
    ).to.be.revertedWithCustomError(zCloakSBT, "AttesterSignatureInvalid");
  });

  it("Should revert with 'AlreadyMint'", async () => {
    // console.log(`zCloakSBT addr: ${zCloakSBT.address}`);
    const verifierSignature =
      "0x0e534547d909935d0aa6ab19392db2262896799207c0a949309cc2a0660de7054b5662c522ee046bdc7523c23d8c73624aa597eb21af3ff01f92ba4b47d98b3301";
    await zCloakSBT.toggleMinting();
    await zCloakSBT.setAssertionMethod(assertionMethod);
    expect(
      await zCloakSBT.checkOnlyTokenID(
        digest,
        attester.address,
        programHash,
        ctype
      )
    ).to.equal(0);
    await zCloakSBT.mint(tokenInfo, verifierSignature);

    expect(
      await zCloakSBT.checkOnlyTokenID(
        digest,
        attester.address,
        programHash,
        ctype
      )
    ).to.equal(1);
    await expect(
      zCloakSBT.mint(tokenInfo, verifierSignature)
    ).to.be.revertedWithCustomError(zCloakSBT, "AlreadyMint");
  });

  it("Should revert with 'DigestAlreadyRevoked'(Attester revert VC Digest first)", async () => {
    // console.log(`zCloakSBT addr: ${zCloakSBT.address}`);
    const verifierSignature =
      "0x5a49a8baf0e8d76d2e99f8cb4758b446b13d3837fd872a18d3649489260f32b9537175d31ee96558688e536898e2b8ff4a83f7e535148b35d74d6b5107d34c9300";
    await zCloakSBT.toggleMinting();
    await zCloakSBT.setAssertionMethod(assertionMethod);

    // attester revoke VC Digest first
    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      false
    );
    await expect(zCloakSBT.connect(attester).revokeByDigest(digest)).to.be.emit(
      zCloakSBT,
      "RevokeSuccess"
    );
    expect(await zCloakSBT.checkRevokeDB(attester.address, digest)).to.equal(
      true
    );

    // mint logic
    await expect(
      zCloakSBT.mint(tokenInfo, verifierSignature)
    ).to.be.revertedWithCustomError(zCloakSBT, "DigestAlreadyRevoked");
  });

  it("Should revert with 'VerifierNotInWhitelist'", async () => {
    // console.log(`zCloakSBT addr: ${zCloakSBT.address}`);
    const fakeVerifier = "0x4867c2Dfa7Aa14459c843d69220623cA97B652d7";
    const verifierSignature =
      "0x45027d24430188739285cecaf6942e1b1035c86e90f66d084f840fb247b7bd0226e3370c1823e757fa7c7eb2b610ce06a290205eacbc369b124846e793cb5c8100";
    await zCloakSBT.toggleMinting();
    await zCloakSBT.setAssertionMethod(assertionMethod);

    const tokenInfoTest = [
      recipient,
      ctype,
      programHash,
      digest,
      fakeVerifier,
      attester.address,
      attesterSignature,
      output,
      issuanceTimestamp,
      expirationTimestamp,
      vcVersion,
      sbtLink,
    ];

    expect(await zCloakSBT.checkVerifierWhitelist(fakeVerifier)).to.equal(
      false
    );
    expect(await zCloakSBT.checkVerifierWhitelist(verifiers[0])).to.equal(true);
    await expect(
      zCloakSBT.mint(tokenInfoTest, verifierSignature)
    ).to.be.revertedWithCustomError(zCloakSBT, "VerifierNotInWhitelist");
  });

  it("Should revert with 'MintInfoInvalid'", async () => {
    // console.log(`zCloakSBT addr: ${zCloakSBT.address}`);
    const realSig =
      "0xaecaf10f3e31c2db2d7c93d15825b81903da043fce3cd612b5149558a91522aa6314f65f9e9aad3cd13474d7e541aaa1a966b346595271e5c54669e6c330103a01";
    const fakeSig =
      "0x2d266c65056c59cafa92a42c341258ba082d71b96ad447d53c34a43511843b1b6c553054c8390319616b37caceeffc82d39ce60ed8d30e8a19c72a177daf51ac00";
    await zCloakSBT.toggleMinting();
    await zCloakSBT.setAssertionMethod(assertionMethod);
    await expect(
      zCloakSBT.mint(tokenInfo, fakeSig)
    ).to.be.revertedWithCustomError(zCloakSBT, "MintInfoInvalid");

    await expect(zCloakSBT.mint(tokenInfo, realSig)).to.be.emit(
      zCloakSBT,
      "MintSuccess"
    );
  });
});
