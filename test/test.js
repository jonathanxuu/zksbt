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
    // console.log(await zCloakSBTObj.CHAIN_ID());
    // console.log(await zCloakSBTObj.DOMAIN_SEPARATOR());
    // console.log(zCloakSBTObj.address)
    await expect(zCloakSBTObj.mint([
        "0x57E7b664aaa7C895878DdCa5790526B9659350Ec",
        "0x824c9cd9f7fe36c33a2ded2c4b17be4b0d8a159f57baa193213e7365be1118bd",
        "0x01d680e6c4f82c8274c43626c67a0f494e65f147245330a3bd6a9c69271223c1",
        "0x0c240bce4ce46341ed63bef97a701881317f381770cab2edf6fe17c4fa547214",
        "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
        "0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1",
        [8,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        1682562340054,
        0,
        "0x0001",
        "ar:///MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ"
    ],"0x3bf8228d9e36c84853a276fcdb0e1fe9fd247c66b0020dfacd620a77111ac5596eeaf0c3fe293936f4ced2d9378224faa6dc6e6eb303418c66c3cd8925a674bf00")).emit(zCloakSBTObj,"MintSuccess");
    // Wait for it to be mined.
    // expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});