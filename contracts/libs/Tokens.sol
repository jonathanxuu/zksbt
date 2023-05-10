pragma solidity >=0.8.0 <0.9.0;
import "hardhat/console.sol";

//SPDX-License-Identifier: MIT

library Tokens {
    error vcVersionNotValid();

    // the version header of the eip191
    bytes25 constant EIP191_VERSION_E_HEADER = "Ethereum Signed Message:\n";

    // the prefix of did, which is 'did::zk'
    bytes7 constant DID_ZK_PREFIX = bytes7("did:zk:");

    // the prefix of the attestation message, which is CredentialVersionedDigest
    bytes25 constant EIP191_CRE_VERSION_DIGEST_PREFIX =
        bytes25("CredentialVersionedDigest");

    // length 41
    bytes constant BINDING_MESSAGE_PART_1 =
        bytes(" will transfer the on-chain zkID Card to ");

    // length 78
    bytes constant BINDING_MESSAGE_PART_2 =
        bytes(
            " for use. I am aware that: If someone maliciously claims it on behalf, did:zk:"
        );

    // length 116
    bytes constant BINDING_MESSAGE_PART_3 =
        bytes(
            " will face corresponding legal risks. If the Ethereum address is changed, all on-chain zkID Cards will be destroyed."
        );

    // length 42
    bytes constant BINDED_MESSAGE =
        bytes(" will accept the zkID Card sent by did:zk:");

    // the length of the CredentialVersionedDigest, which likes CredentialVersionedDigest0x00011b32b6e54e4420cfaf2feecdc0a15dc3fc0a7681687123a0f8cb348b451c2989
    // length 57, 25+ 2 + 32 = 59
    bytes2 constant EIP191_CRE_VERSION_DIGEST_LEN_V1 = 0x3539;

    // length 302, 7 + 20 + 41 + 20 + 78 +20 + 116 = 302
    bytes3 constant BINDING_MESSAGE_LEN = 0x333032;

    // length 82, 20 + 42 + 20 = 82
    bytes2 constant BINDED_MESSAGE_LEN = 0x3832;

    bytes32 public constant MINT_TYPEHASH =
        keccak256(
            "signature(address recipient,bytes32 ctype,bytes32 programHash,bytes32 digest,address verifier,address attester,uint64[] output,uint64 issuanceTimestamp,uint64 expirationTimestamp,bytes2 vcVersion,string sbtLink)"
        );
    struct Token {
        address recipient;
        bytes32 ctype;
        bytes32 programHash;
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
        bytes32 digest;
        address attester;
        uint64[] output;
        uint64 mintTimestamp;
        uint64 issuanceTimestamp;
        uint64 expirationTimestamp;
        bytes2 vcVersion;
        string sbtLink;
    }

    // todo: function sbt mint to a contract

    function fillTokenOnChain(
        Token memory token,
        uint64 time,
        address realRecipient
    ) public pure returns (TokenOnChain memory tokenOnchain) {
        tokenOnchain.recipient = realRecipient;
        tokenOnchain.ctype = token.ctype;
        tokenOnchain.programHash = token.programHash;
        tokenOnchain.digest = token.digest;
        tokenOnchain.attester = token.attester;
        tokenOnchain.output = token.output;
        tokenOnchain.issuanceTimestamp = token.issuanceTimestamp;
        tokenOnchain.expirationTimestamp = token.expirationTimestamp;
        tokenOnchain.vcVersion = token.vcVersion;
        tokenOnchain.sbtLink = token.sbtLink;
        tokenOnchain.mintTimestamp = time;
    }

    function getRecipient(
        Token memory tokenDetail
    ) public pure returns (address) {
        return tokenDetail.recipient;
    }

    function verifyAttesterSignature(
        address attesterAssertionMethod,
        bytes memory attesterSignature,
        bytes32 digest,
        bytes2 vcVersion
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash;

        if (vcVersion == 0x0001) {
            bytes memory versionedDigest = abi.encodePacked(vcVersion, digest);
            ethSignedMessageHash = keccak256(
                abi.encodePacked(
                    bytes1(0x19),
                    EIP191_VERSION_E_HEADER,
                    EIP191_CRE_VERSION_DIGEST_LEN_V1,
                    EIP191_CRE_VERSION_DIGEST_PREFIX,
                    versionedDigest
                )
            );
        } else {
            revert vcVersionNotValid();
        }
        return
            _recover(ethSignedMessageHash, attesterSignature) ==
            attesterAssertionMethod;
    }

    function verifySignature(
        Token memory tokenDetail,
        bytes memory signature,
        bytes32 domain_separator
    ) internal pure returns (bool) {
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                tokenDetail.recipient,
                tokenDetail.ctype,
                tokenDetail.programHash,
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

        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19\x01", domain_separator, structHash)
        );

        if (_recover(messageHash, signature) != tokenDetail.verifier) {
            return false;
        }
        return true;
    }

    function verifyBindingSignature(
        address bindingAddress,
        address bindedAddress,
        bytes memory bindingSignature,
        bytes memory bindedSignature
    ) internal pure returns (bool) {
        bytes32 bindingMessageHash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                EIP191_VERSION_E_HEADER,
                BINDING_MESSAGE_LEN,
                DID_ZK_PREFIX,
                abi.encodePacked(bindingAddress),
                BINDING_MESSAGE_PART_1,
                abi.encodePacked(bindedAddress),
                BINDING_MESSAGE_PART_2,
                abi.encodePacked(bindingAddress),
                BINDING_MESSAGE_PART_3
            )
        );
        bytes32 bindedMessageHash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                EIP191_VERSION_E_HEADER,
                BINDED_MESSAGE_LEN,
                abi.encodePacked(bindedAddress),
                BINDED_MESSAGE,
                abi.encodePacked(bindingAddress)
            )
        );

        return (_recover(bindingMessageHash, bindingSignature) ==
            bindingAddress &&
            _recover(bindedMessageHash, bindedSignature) == bindedAddress);
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
