//SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.0 <0.9.0;

interface ArbInfo {
    /// @notice Retrieves an account's balance
    function getBalance2(address account) external view returns (uint256);
    function add(uint256 item_1, uint256 item_2) external view returns (uint256);

    /// @notice Retrieves a contract's deployed code
    function getCode(address account) external view returns (bytes memory);
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

    // function get() public view returns (
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256
    //     ) {

    //     return  ArbGasInfo(proxyContract).getPricesInWei(
    //             );
    //     }
    function add(uint256 item_1, uint256 item_2) public view returns (uint256){
         return  ArbInfo(proxyContract).add(item_1, item_2);
    }

    
}
