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
      optimisticGoerli: process.env.ETHSCAN_API_KEY,
      "base-goerli": process.env.BASEAPI,
      linea: process.env.ETHSCAN_API_KEY2,

    },
    customChains: [
      {
        network: "linea",
        chainId: 59140,
        urls: {
          apiURL: "https://explorer.goerli.linea.build/api",
          browserURL: "https://explorer.goerli.linea.build/"
        }
      },
      {
        network: "base-goerli",
        chainId: 84531,
        urls: {
         apiURL: "https://api-goerli.basescan.org/api",
         browserURL: "https://goerli.basescan.org"
        }
      }

    ]
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    linea: {
      url: `https://rpc.goerli.linea.build/`,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'base-goerli': {
      allowUnlimitedContractSize: true,
      url: 'https://shy-alien-sailboat.base-goerli.discover.quiknode.pro/a3ec1f5083aba55ae5627e9266458017f9d3f29b/',
      chainId: 84531,
      live: true,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
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

