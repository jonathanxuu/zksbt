pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: Apache-2.0
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {Base64} from "base64-sol/base64.sol";
import {Tokens} from "./libs/Tokens.sol";

error Soulbound();
error MintDisabled();
error InvalidSignature();
error DoesNotExist();
error MintInfoInvalid();
error AlreadyMint();
error DigestAlreadyRevoked();
error BindingNotExist();
error BindingAlreadyOccupied();
error VerifierNotInWhitelist();
error AlreadySetKey();
error NotSetKey();

contract zCloakSBT is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    /*///////////////////////////////////////////////////////////////
STORAGE
 //////////////////////////////////////////////////////////////*/

    Counters.Counter private _tokenIds;

    bool public mintOpen;

    // used for attesters/verifiers to store their key mapping;
    mapping(address => address) private _assertionKeyMapping;

    mapping(address => bool) private _verifierWhitelist;

    mapping(uint256 => Tokens.TokenOnChain) private _tokenDB;

    // used to bind a did address with a eth address (all the sbt mint to the binding addr should be mint to the binded addr instead)
    mapping(address => address) private _bindingDB;

    // Record the tokenID mint by the verifier, is the verifier is dishonest, burn all SBTs handled by the verifier
    mapping(address => uint256[]) private _verifierWorkDB;

    // Avoid mint multiple SBT of the same tokenInfo, we need to add a registry to flag that（digest, attester, programHash, ctype)=> tokenID
    mapping(bytes32 => mapping(address => mapping(bytes32 => mapping(bytes32 => uint256))))
        private _onlyTokenID;

    // A storage for the attester to revoke certain VC, thus the SBT should be burn therefore(if not mint yet, forbid its mint in the future) (attester, digest)
    mapping(address => mapping(bytes32 => bool)) private _revokeDB;

    // Record all SBT(tokenID) minted by the specific digest (attester, digest) => tokenID[]
    mapping(address => mapping(bytes32 => uint256[]))
        private _digestConvertCollection;

    /*///////////////////////////////////////////////////////////////
 EVENTS
 //////////////////////////////////////////////////////////////*/

    event MintSuccess(address indexed recipent, uint256 indexed tokenID);
    event RevokeSuccess(address indexed attester, uint256[] tokenIDList);
    event BindingSetSuccess(
        address indexed bindingAddr,
        address indexed bindedAddr
    );
    event UnBindingSuccess(
        address indexed bindingAddr,
        address indexed bindedAddr
    );
    event VerifierWhiteListAdd(address[] indexed verifiers);
    event VerifierWhiteListDelete(address[] indexed verifiers);

    /*///////////////////////////////////////////////////////////////
 EIP-712 STORAGE
 //////////////////////////////////////////////////////////////*/

    uint256 internal immutable INITIAL_CHAIN_ID;

    bytes32 internal immutable INITIAL_DOMAIN_SEPARATOR;

    /*///////////////////////////////////////////////////////////////
 STRUCTOR
 //////////////////////////////////////////////////////////////*/

    constructor(
        address[] memory _trustedVerifiers
    ) ERC721("zCloak SBT", "zkSBT") {
        INITIAL_CHAIN_ID = block.chainid;
        INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();
        for (uint i = 0; i < _trustedVerifiers.length; i++) {
            _verifierWhitelist[_trustedVerifiers[i]] = true;
        }
    }

    /*///////////////////////////////////////////////////////////////
 CORE LOGIC
 //////////////////////////////////////////////////////////////*/

    /**
     * @notice Used to add or delete some verifiers to/from the verifierWhiteList, is `isAdd` is true, add, else remove
     */
    //prettier-ignore
    function modifyVerifierWhitelist(bool isAdd, address[] memory modifiedVerifiers) public {
        if (isAdd){
            for ( uint i = 0; i < modifiedVerifiers.length; i++){
                require(_verifierWhitelist[modifiedVerifiers[i]] == false, "Already in VerifierWhitelist");
            }
            
            for( uint i = 0; i < modifiedVerifiers.length; i++){
                _verifierWhitelist[modifiedVerifiers[i]] = true;
            }
            emit VerifierWhiteListAdd(modifiedVerifiers);
        } else {
            for ( uint i = 0; i < modifiedVerifiers.length; i++){
                require(_verifierWhitelist[modifiedVerifiers[i]] == true, "Not in VerifierWhitelist");
            }
            
            for( uint i = 0; i < modifiedVerifiers.length; i++){
                _verifierWhitelist[modifiedVerifiers[i]] = false;
            }
            emit VerifierWhiteListDelete(modifiedVerifiers);

        }
    }

    /**
     * @notice Mint a digestSBT according to the vc, this doesn't need a zkProof / Verifier, just used to proof the user owns certain VC. Used to proof he/she owns some certian digestVC
     */
    //prettier-ignore
    function digestMint(Tokens.Token memory tokenInfo, bytes memory attesterSignature) public payable nonReentrant {
        // todo: add check, verify attester's signature
        // todo: to avoid the picture to be replaced, the SBT picture should be generated by svg
        if (mintOpen == false) revert MintDisabled();

        // Make sure the digest SBT hasn't been mint yet
        // todo: add mapping for _onlyDigestTokenID
        if (_onlyDigestTokenID[tokenInfo.digest][tokenInfo.attester] != 0){
            revert AlreadyMint();
        }
    }

    /**
     * @notice Mint a zkSBT according to the TokenInfo and the Signature generated by the ZKP Verifier
     */
    //prettier-ignore
    function mint(Tokens.Token memory tokenInfo, bytes memory verifierSignature) public payable nonReentrant {
        if (mintOpen == false) revert MintDisabled();

        // Make sure the SBT hasn't been mint yet
        if (_onlyTokenID[tokenInfo.digest][tokenInfo.attester][tokenInfo.programHash][tokenInfo.ctype] != 0){
            revert AlreadyMint();
        }

        // Make sure the VC issued by the attester is not revoked yet
        if (_revokeDB[tokenInfo.attester][tokenInfo.digest] == true) {
            revert DigestAlreadyRevoked();
        }

        // Make sure the verifier is in our WhiteList
        if (_verifierWhitelist[tokenInfo.verifier] == false) {
            revert VerifierNotInWhitelist();
        }

        // Verify the signature first, then mint
        // bool isTokenInfoValid = Tokens.verifySignature(tokenInfo, verifierSignature);
        // if (isTokenInfoValid == false) revert MintInfoInvalid();

        _tokenIds.increment();
        uint256 id = _tokenIds.current();

        // check whether there exist a binded address on-chain, if yes, mint the SBT to the binded address
        address realRecipient = (_bindingDB[tokenInfo.recipient] == address(0) ? Tokens.getRecipient(tokenInfo) : _bindingDB[tokenInfo.recipient]);
        Tokens.TokenOnChain memory tokenOnChainInfo = Tokens.fillTokenOnChain(tokenInfo, _time(), realRecipient);

        _mint(realRecipient, id);
        _tokenDB[id] = tokenOnChainInfo;

        // Push the tokenID to the work of the verifier
        _verifierWorkDB[tokenInfo.verifier].push(id);
        _onlyTokenID[tokenOnChainInfo.digest][tokenOnChainInfo.attester][tokenOnChainInfo.programHash][tokenOnChainInfo.ctype] = id;


        // Add the tokenID to the digest collection, when revoke the digest, could burn all the tokenID related to that
        // todo: to check the new id is added successfully
        _digestConvertCollection[tokenOnChainInfo.attester][tokenOnChainInfo.digest].push(id);

        emit MintSuccess(realRecipient, id);
    }

    /**
     * @notice A function for attesters to register the revoked VC digest, which thus burn the SBT made by the digest, and if not mint yet, forbid its mint in the future
     */
    //prettier-ignore
    function revokeByDigest(bytes32 digest) public {
        if (_revokeDB[msg.sender][digest] == true) {
            revert DigestAlreadyRevoked();
        }

        _revokeDB[msg.sender][digest] == true;
        uint256[] memory revokeList = _digestConvertCollection[msg.sender][digest];
        for (uint i = 0; i < revokeList.length; i++){
            super._burn(revokeList[i]);
        }
        emit RevokeSuccess(msg.sender, revokeList);
    }

    /**
     * @notice Used to set the binding relation, the `signatureBinding` should be generated by the bindingAddr, the `signatureBinded` should be generated by the bindedAddr
     */
    //prettier-ignore
    function setBinding(address bindingAddr, address bindedAddr, bytes memory signatureBinding, bytes memory signatureBinded) public payable {
        if (_bindingDB[bindingAddr] != address(0)) {
            revert BindingAlreadyOccupied();
        }

        // todo: Add check for the 2 signature, when the binding relation is set, should emit a event 

        _bindingDB[bindingAddr] = bindedAddr;
        emit BindingSetSuccess(bindingAddr, bindedAddr);
    }

    /**
     * @notice Used to set the unbind the ralation stored on chain
     */
    //prettier-ignore
    function unBinding(address bindingAddr, address bindedAddr, bytes memory signatureBinding, bytes memory signatureBinded) public payable {
        if (_bindingDB[bindingAddr] != bindedAddr) {
            revert BindingNotExist();
        }

        // todo: Add check for the 2 signature, when the unbinding is done should emit a event 

        _bindingDB[bindingAddr] = address(0);
        emit UnBindingSuccess(bindingAddr, bindedAddr);
    }

    /**
     * @notice Used to set the key ralation stored on chain
     */
    //prettier-ignore
    function setAssertionKey(address assertionKey) public payable {
        if (_assertionKeyMapping[msg.sender] != address(0)) {
            revert AlreadySetKey();
        }
        _assertionKeyMapping[msg.sender] = assertionKey;
    }

    /**
     * @notice Used to remove the key ralation stored on chain
     */
    //prettier-ignore
    function removeAssertionKey(address assertionKey) public payable {
        if (_assertionKeyMapping[msg.sender] == address(0)) {
            revert NotSetKey();
        }
        _assertionKeyMapping[msg.sender] = address(0);
    }

    /**
     * @notice Used to check whether the user owns a certain class of zkSBT with certain programHash, and whether it is valid at present.
     */
    //prettier-ignore
    function checkSBTClassValid(address userAddr, address attester, bytes32 programHash, bytes32 ctype) public view returns (bool) {
        // todo: Need to code check logics

    }

    /**
     * @notice Used to check whether the user owns a certain class of SBT with certain ctype
     */
    //prettier-ignore
    function checkDigestSBTValid(address userAddr, address attester, bytes32 ctype) public view returns (bool) {
        // todo: Need to code check logics
    }

    /**
     * @notice Check whether a zkSBT is valid, check its existance, expirationDate not reach and it hasn't been revoked.
     * add verifier list.
     */
    //prettier-ignore
    function checkTokenValid(uint256 id) public view returns (bool) {
        // check its existance
        // todo: do a test -- check if an attester revoked, wheather it is still exsit?
        if (!_exists(id)) return false;

        // check its expirationDate
        if (_tokenDB[id].expirationTimestamp >= _time()){
            return false;
        }
        return true;
    }

    /**
     * @notice Receives json from constructTokenURI
     */
    // prettier-ignore
    function tokenURI(uint256 id) public view override returns (string memory) {
        if (!_exists(id)) revert DoesNotExist();
        // todo: dertermine whether need's title and description for each SBT.
        return _tokenDB[id].sbtFigure;
    }

    function contractURI() external pure returns (string memory) {
        string
            memory collectionImage = "ar://MzXyO8ZH3dyyp9wdXAVuUT57vGLFifs3TnskClOoFSQ";
        string memory json = string.concat(
            '{"name": "zCloak SBT","description":"This is a zkSBT collection launched by zCloak Network which can be used to represent ones personal identity without revealing their confidential information","image":"',
            collectionImage,
            '"}'
        );
        return string.concat("data:application/json;utf8,", json);
    }

    /**
     * @notice Toggles Pledging On / Off
     */
    function toggleMinting() public onlyOwner {
        mintOpen == false ? mintOpen = true : mintOpen = false;
    }

    /*///////////////////////////////////////////////////////////////
 TOKEN LOGIC
 //////////////////////////////////////////////////////////////*/

    /**
     * @notice SOULBOUND: Block transfers.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721Enumerable) {
        require(
            // can only be mint by address `0` and can be (burn by) transfered to the opensea burn address
            from == address(0) ||
                to == address(0x000000000000000000000000000000000000dEaD),
            "SOULBOUND: Non-Transferable"
        );
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @notice SOULBOUND: Block approvals.
     */
    function setApprovalForAll(
        address operator,
        bool _approved
    ) public virtual override(ERC721, IERC721) {
        revert Soulbound();
    }

    /**
     * @notice SOULBOUND: Block approvals.
     */
    function approve(
        address to,
        uint256 tokenId
    ) public virtual override(ERC721, IERC721) {
        revert Soulbound();
    }

    /**
     * @notice https://eips.ethereum.org/EIPS/eip-712
     * todo : here, need to modify the EIP712 domain struct, etc.
     */
    function DOMAIN_SEPARATOR() public view virtual returns (bytes32) {
        return
            block.chainid == INITIAL_CHAIN_ID
                ? INITIAL_DOMAIN_SEPARATOR
                : computeDomainSeparator();
    }

    function computeDomainSeparator() internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("zCloakSBT")),
                    keccak256(bytes("0")),
                    block.chainid,
                    address(this)
                )
            );
    }

    /**
     * @dev Returns the current's block timestamp. This method is overridden during tests and used to simulate the
     * current block time.
     */
    function _time() internal view returns (uint64) {
        return uint64(block.timestamp);
    }
}
