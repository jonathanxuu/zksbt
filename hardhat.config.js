/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: '0.8.17',
  networks: {
    matic: {
      url: process.env.QUICKNODE_API_KEY_URL,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "G2ZUJAF4RKVH6ZBEJMAJ7WDZ7GGN9N3KVX",
  },
  allowUnlimitedContractSize: true
};

