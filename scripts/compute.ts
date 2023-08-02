import {utils} from 'ethers'
let trustedRemote = utils.solidityPack(
    ['address','address'],
    ['0xe2Ff91871E6c09E1756059F777fa2972e45dB8B8', '0x005326bfCe4a58C42AFe7709ece7dC98d32EEaf2']
)
console.log(trustedRemote)