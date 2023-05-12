const { expect } = require("chai");

describe("Token contract", function () {
    before(async function () {
        libTokens = await ethers.getContractFactory("Tokens");
        libTokensObj = await libTokens.deploy();
        await libTokensObj.deployed();
    
        zCloakSBT = await ethers.getContractFactory("zCloakSBT", {
          libraries: {
            Tokens: libTokensObj.address,
          }
        });
        zCloakSBTObj = await zCloakSBT.deploy(["0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1"]);
        await zCloakSBTObj.deployed();
        let toggleOpen = await zCloakSBTObj.toggleMinting();
        await toggleOpen.wait()
    });


  it("Check Verifier Signature", async () => {
    console.log(await zCloakSBTObj.CHAIN_ID());
    console.log(await zCloakSBTObj.DOMAIN_SEPARATOR());
    console.log(zCloakSBTObj.address)
    // console.log(await ethers.getSigner())
    await zCloakSBTObj.setAssertionMethod("0x361F1dd3db9037d2aC39f84007DC65dfA8BD248E");

    await expect(zCloakSBTObj.mint([
        "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
        "0x1209c3865ae4631cceacfbb3d4a946fec4ff97d3c7454a0383cb7e26b0bb8189",
        "0x415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872",
        "0xf8def3fd1c7a973caf9585004572425a57629135f75e59f9e86c866e5ef4a711",
        "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
        "0x57E7b664aaa7C895878DdCa5790526B9659350Ec",
        "0xa2c943344e2ad6518a6ba093bfd66a48e2342d0a371c78654da530f073eb74d82ccf2308c943d15430c8fed312927e8e68d74a490b8a0727e712d617fcc829e400",
        [8,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        1683795666607,
        0,
        "0x0001",
        "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ"
    ],"0x24a068b5df815846ca43947412637b182ed2d02273600ac8252c6ce75b9345ac0f6a89e56017465dd0418e7773d0e7e9ed33fe78e0d113aad4bfcf072a3150ab01")).emit(zCloakSBTObj,"MintSuccess");
    // Wait for it to be mined.
  });
});