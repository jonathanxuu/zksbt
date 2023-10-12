/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require('hardhat-abi-exporter');

const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

module.exports = {  abiExporter: {
  path: './data/abi',
  runOnCompile: true,
  clear: true,
  flat: true,
  spacing: 2,
  // format: "minimal",
},
  etherscan: {
    apiKey: {
      "arbitrum-goerli": process.env.ARB_API_KEY2,
      optimisticGoerli: process.env.ETHSCAN_API_KEY,
      "base-goerli": process.env.BASEAPI,
      "base-mainnet": process.env.BASEMAINAPI,
      linea: process.env.ETHSCAN_API_KEY,
      "wanghui": process.env.ETHSCAN_API_KEY,
      "wanghuil2": process.env.ETHSCAN_API_KEY,
      arbitrumOne: process.env.ARB_API_MAIN
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
      },
      {
        network: "arbitrum-goerli",
        chainId: 421613,
        urls: {
          apiURL: "https://api-goerli.arbiscan.io/api",
          browserURL: "https://api-goerli.arbiscan.io"
        }
      },
      { 
        network: 'wanghui',
        chainId: 5468810273,
        urls: {
          apiURL: 'http://3.101.131.66:4000/api',
        }
      },
      { 
        network: 'wanghuil2',
        chainId: 412346,
        urls: {
          apiURL: 'http://54.184.214.151:4000/api',
        }
      },
      {
        network: "base-mainnet",
        chainId: 8453,
        urls: {
         apiURL: "https://api.basescan.org/api",
         browserURL: "https://basescan.org"
        }
      },
    ]
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20,
      },
      viaIR: true,
    },
  },
  networks: {
    arbitrumOne: {
      url: 'https://arb1.arbitrum.io/rpc',
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'linea': {
      allowUnlimitedContractSize: true,
      url: `https://rpc.goerli.linea.build/`,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'arbitrum-goerli': {
      allowUnlimitedContractSize: true,
      chainId: 421613,
      live: true,
      url: 'https://arb-goerli.g.alchemy.com/v2/gqUGW2rRWKfTtf4j9qRnAoCl67ehpsao',
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'base-goerli': {
      allowUnlimitedContractSize: true,
      url: 'https://shy-alien-sailboat.base-goerli.discover.quiknode.pro/a3ec1f5083aba55ae5627e9266458017f9d3f29b/',
      chainId: 84531,
      live: true,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'wanghui':{
      allowUnlimitedContractSize: true,
      url: 'http://3.101.131.66:8449/',

    
      chainId: 5468810273,
      live: true,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    'wanghuil2':{
      allowUnlimitedContractSize: true,
      url: 'http://54.184.214.151:8547/',

    
      chainId: 412346,
      live: true,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },

    'base-mainnet': {
      url: 'https://developer-access-mainnet.base.org',
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

