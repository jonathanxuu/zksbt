/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

module.exports = {
  etherscan: {
    apiKey: {
      optimisticGoerli: process.env.ETHSCAN_API_KEY
    }
  },
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
    optimisticGoerli: {
      allowUnlimitedContractSize: true,
      // url: process.env.QUICKNODE_API_KEY_URL,
      url: `https://opt-goerli.g.alchemy.com/v2/H91sFaLoYh4VwBsHajIRRpOSc1CKawJm`,
      chainId: 420,
      live: true,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    hardhat: {
      accounts: {mnemonic: process.env.MNEMONIC_ALICE}
    },
  },

  allowUnlimitedContractSize: true,
  
};

