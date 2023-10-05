//SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.0 <0.9.0;


interface ArbGasInfo {
    /// @notice Get gas prices. Uses the caller's preferred aggregator, or the default if the caller doesn't have a preferred one.
    /// @return return gas prices in wei
    ///        (
    ///            per L2 tx,
    ///            per L1 calldata byte
    ///            per storage allocation,
    ///            per ArbGas base,
    ///            per ArbGas congestion,
    ///            per ArbGas total
    ///        )
    function getPricesInWei()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        );
}

contract TestPre {

    address private proxyContract;

    // toggle whether the faucet requirement is needed(24*60*60*1000 limit)
    bool private _faucetRequirementToggle;
    // toggle whether the _beforeTokenTransfer is needed(to check the requirement)
    bool private _transferCheck;
    // mapping the latest block when the address mint CToken
    mapping(address => uint64) private _mintDB;

    constructor(
        address _contractAddr
    ) {
      proxyContract =  _contractAddr;
    }

    function get() public view returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        ) {

        return  ArbGasInfo(proxyContract).getPricesInWei(
                );
        }
}
