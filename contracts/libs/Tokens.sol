pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: MIT
contract Tokens {
    error vcVersionNotValid();

    // the version header of the eip191
    bytes25 constant EIP191_VERSION_E_HEADER = "Ethereum Signed Message:\n";

    // Ethereum Signed Message:\nCredentialVersionedDigest0xabcd12345678  + signature  -> attester

    // the prefix of did, which is 'did::zk'
    bytes7 constant DID_ZK_PREFIX = bytes7("did:zk:");

    // the prefix of the attestation message, which is CredentialVersionedDigest
    bytes25 constant EIP191_CRE_VERSION_DIGEST_PREFIX =
        bytes25("CredentialVersionedDigest");

    // length 41
    bytes constant BINDING_MESSAGE_PART_1 =
        bytes(" will transfer the on-chain zkID Card to ");

    // length 81
    bytes constant BINDING_MESSAGE_PART_2 =
        bytes(
            " for use.\n\n I am aware that:\n If someone maliciously claims it on behalf, did:zk:"
        );

    // length 126
    bytes constant BINDING_MESSAGE_PART_3 =
        bytes(
            " will face corresponding legal consequences.\n If the Ethereum address is changed, all on-chain zklD Cards will be invalidated."
        );

    // length 42
    bytes constant BINDED_MESSAGE =
        bytes(" will accept the zkID Card sent by did:zk:");

    // the length of the CredentialVersionedDigest, which likes CredentialVersionedDigest0x00011b32b6e54e4420cfaf2feecdc0a15dc3fc0a7681687123a0f8cb348b451c2989
    // length 59, 25+ 2 + 32 = 59
    bytes2 constant EIP191_CRE_VERSION_DIGEST_LEN_V1 = 0x3539;

    // length 381, 7 + 42 + 41 + 42 + 81 + 42 + 126  = 381
    bytes3 constant BINDING_MESSAGE_LEN = 0x333831;

    // length 126, 42 + 42 + 42 = 126
    bytes3 constant BINDED_MESSAGE_LEN = 0x313236;

    bytes32 public constant MINT_TYPEHASH =
        keccak256(
            "signature(address recipient,bytes32 ctype,bytes32 programHash,uint64[] publicInput,bool isPublicInputUsedForCheck,bytes32 digest,address verifier,address attester,uint64[] output,uint64 issuanceTimestamp,uint64 expirationTimestamp,bytes2 vcVersion,string sbtLink)"
        );
    struct Token {
        address recipient;
        bytes32 ctype;
        bytes32 programHash;
        uint64[] publicInput;
        bool isPublicInputUsedForCheck;
        bytes32 digest;
        address verifier;
        address attester;
        bytes attesterSignature;
        uint64[] output;
        uint64 issuanceTimestamp;
        uint64 expirationTimestamp;
        bytes2 vcVersion;
        string sbtLink;
    }

    struct TokenOnChain {
        address recipient;
        bytes32 ctype;
        bytes32 programHash;
        uint64[] publicInput;
        bool isPublicInputUsedForCheck;
        bytes32 digest;
        address attester;
        uint64[] output;
        uint64 mintTimestamp;
        uint64 issuanceTimestamp;
        uint64 expirationTimestamp;
        bytes2 vcVersion;
        string sbtLink;
    }

    struct SBTWithUnnecePublicInput {
        uint64[] publicInput;
        uint256 tokenID;
    }


    function fillTokenOnChain(
        Token memory token,
        uint64 time,
        address realRecipient
    ) public pure returns (TokenOnChain memory tokenOnchain) {
        tokenOnchain.recipient = realRecipient;
        tokenOnchain.ctype = token.ctype;
        tokenOnchain.programHash = token.programHash;
        tokenOnchain.publicInput = token.publicInput;
        tokenOnchain.isPublicInputUsedForCheck = token.isPublicInputUsedForCheck;
        tokenOnchain.digest = token.digest;
        tokenOnchain.attester = token.attester;
        tokenOnchain.output = token.output;
        tokenOnchain.issuanceTimestamp = token.issuanceTimestamp;
        tokenOnchain.expirationTimestamp = token.expirationTimestamp;
        tokenOnchain.vcVersion = token.vcVersion;
        tokenOnchain.sbtLink = token.sbtLink;
        tokenOnchain.mintTimestamp = time;
    }

    function changeRecipient(
        TokenOnChain memory originTokenOnChain,
        address realRecipient
    ) public pure returns (TokenOnChain memory tokenOnchain){
        tokenOnchain.recipient = realRecipient;
        tokenOnchain.ctype = originTokenOnChain.ctype;
        tokenOnchain.programHash = originTokenOnChain.programHash;
        tokenOnchain.publicInput = originTokenOnChain.publicInput;
        tokenOnchain.isPublicInputUsedForCheck = originTokenOnChain.isPublicInputUsedForCheck;
        tokenOnchain.digest = originTokenOnChain.digest;
        tokenOnchain.attester = originTokenOnChain.attester;
        tokenOnchain.output = originTokenOnChain.output;
        tokenOnchain.issuanceTimestamp = originTokenOnChain.issuanceTimestamp;
        tokenOnchain.expirationTimestamp = originTokenOnChain.expirationTimestamp;
        tokenOnchain.vcVersion = originTokenOnChain.vcVersion;
        tokenOnchain.sbtLink = originTokenOnChain.sbtLink;
        tokenOnchain.mintTimestamp = originTokenOnChain.mintTimestamp;
    }

    function getRecipient(
        Token memory tokenDetail
    ) public pure returns (address) {
        return tokenDetail.recipient;
    }



    function verifySignature(
        Token calldata tokenDetail,
        bytes calldata signature,
        uint64 blocknumber
    ) public view returns (bool) {
        // require(msg.sender ==, "error");

        require(blocknumber < block.timestamp, "error");

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                tokenDetail.recipient,
                tokenDetail.ctype,
                tokenDetail.programHash,
                // keccak256(abi.encodePacked(tokenDetail.publicInput)),
                // tokenDetail.isPublicInputUsedForCheck,
                tokenDetail.digest,
                tokenDetail.verifier,
                tokenDetail.attester,
                keccak256(abi.encodePacked(tokenDetail.output)),
                tokenDetail.issuanceTimestamp,
                tokenDetail.expirationTimestamp,
                tokenDetail.vcVersion,
                keccak256(bytes(tokenDetail.sbtLink))
            )
        );
        bytes32 saparator = DomainSeparator();
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19\x01", saparator, structHash)
        );

        if (_recover(messageHash, signature) != tokenDetail.verifier) {
            return false;
        }
        return true;
    }

     function DomainSeparator() public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("zCloakSBT")),
                    keccak256(bytes("0")),
                    1,
                    address(0x57E7b664aaa7C895878DdCa5790526B9659350Ec)
                )
            );
    }
     function chainID() public view returns (uint) {
        return
          
                    block.chainid;
    }

    /**
     * @dev parse the signature, and recover the signer address
     * @param hash, the messageHash which the signer signed
     * @param sig, the signature
     */
    function _recover(
        bytes32 hash,
        bytes memory sig
    ) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Check the signature length
        if (sig.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            // solium-disable-next-line arg-overflow
            return ecrecover(hash, v, r, s);
        }
    }

}
