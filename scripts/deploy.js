
const main = async () => {
    let libTokens;
    let libTokensObj;
    libTokens = await hre.ethers.getContractFactory("Tokens");
    libTokensObj = await libTokens.deploy();
    await libTokensObj.deployed();
    console.log("Contract tokens deployed to:", libTokensObj.address);

    const nftContractFactory = await hre.ethers.getContractFactory('zCloakSBT', {
        libraries: {
            Tokens: libTokensObj.address,
        }
    });
    const nftContract = await nftContractFactory.deploy(["0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1"]);
    await nftContract.deployed();
    console.log("Contract deployed to:", nftContract.address);
  
    let toggleOpen = await nftContract.toggleMinting();
    await toggleOpen.wait()

    // // Call the function.
    // let txn = await nftContract.mint([
    //         "0x05476EE9235335ADd2e50c09B2D16a3A2cC4ebEC",
    //         "0x9884edce63d4de703c4b3ebf23063929705b7139ce2eeb3b6631c2fa25deb74f",
    //         "0x9884edce63d4de703c4b3ebf23063929705b7139ce2eeb3b6631c2fa25deb74f",
    //         "0x9884edce63d4de703c4b3ebf23063929705b7139ce2eeb3b6631c2fa25deb74f",
    //         "0x05476EE9235335ADd2e50c09B2D16a3A2cC4ebEC",
    //         "0x05476EE9235335ADd2e50c09B2D16a3A2cC4ebEC",
    //         [0,0,1],
    //         1680231693549,
    //         1680231693550,
    //         "0x0001",
    //         "https://jsonkeeper.com/b/RJDK"
    // ],"0x0001")
    // Wait for it to be mined.
    // await txn.wait()
    // console.log("Minted NFT #1")
  

  };
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();
  