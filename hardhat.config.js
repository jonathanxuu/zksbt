/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    op_testnet: {
      allowUnlimitedContractSize: true,
      url: process.env.QUICKNODE_API_KEY_URL,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    hardhat: {
      accounts: {mnemonic: "increase help fortune noise jelly bronze hand among like powder crowd swamp"}
    },
  },
  allowUnlimitedContractSize: true,
  
};

