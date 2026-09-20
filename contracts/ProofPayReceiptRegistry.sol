// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProofPayReceiptRegistry
/// @notice Anchors a hash of a payment receipt without storing invoice text or private metadata.
/// @dev This registry does not prove that the referenced transfer happened. A client must first
///      verify the source-chain receipt and canonical token Transfer log, then anchor its digest.
contract ProofPayReceiptRegistry {
    struct ReceiptAnchor {
        address submitter;
        address token;
        address payer;
        address payee;
        uint256 amount;
        uint256 sourceChainId;
        bytes32 sourceTxHash;
        uint64 anchoredAt;
    }

    mapping(bytes32 receiptHash => ReceiptAnchor anchor) private _anchors;

    error ZeroReceiptHash();
    error AlreadyAnchored(bytes32 receiptHash);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidSourceChain();
    error ZeroSourceTransactionHash();

    event ReceiptAnchored(
        bytes32 indexed receiptHash,
        bytes32 indexed sourceTxHash,
        address indexed submitter,
        uint256 sourceChainId,
        address token,
        address payer,
        address payee,
        uint256 amount,
        uint64 anchoredAt
    );

    /// @notice Records a public commitment to an independently verified token transfer.
    /// @param receiptHash SHA-256 digest of the canonical ProofPay receipt payload.
    /// @param sourceChainId Chain ID where the payment transfer occurred.
    /// @param sourceTxHash Transaction hash containing the transfer log.
    /// @param token Canonical token contract used by the transfer.
    /// @param payer Address that sent the tokens.
    /// @param payee Address that received the tokens.
    /// @param amount Atomic token amount, without decimal conversion.
    function anchorReceipt(
        bytes32 receiptHash,
        uint256 sourceChainId,
        bytes32 sourceTxHash,
        address token,
        address payer,
        address payee,
        uint256 amount
    ) external {
        if (receiptHash == bytes32(0)) revert ZeroReceiptHash();
        if (_anchors[receiptHash].anchoredAt != 0) revert AlreadyAnchored(receiptHash);
        if (sourceChainId == 0) revert InvalidSourceChain();
        if (sourceTxHash == bytes32(0)) revert ZeroSourceTransactionHash();
        if (token == address(0) || payer == address(0) || payee == address(0)) {
            revert InvalidAddress();
        }
        if (amount == 0) revert InvalidAmount();

        uint64 timestamp = uint64(block.timestamp);
        _anchors[receiptHash] = ReceiptAnchor({
            submitter: msg.sender,
            token: token,
            payer: payer,
            payee: payee,
            amount: amount,
            sourceChainId: sourceChainId,
            sourceTxHash: sourceTxHash,
            anchoredAt: timestamp
        });

        emit ReceiptAnchored(
            receiptHash,
            sourceTxHash,
            msg.sender,
            sourceChainId,
            token,
            payer,
            payee,
            amount,
            timestamp
        );
    }

    function getReceipt(bytes32 receiptHash) external view returns (ReceiptAnchor memory) {
        return _anchors[receiptHash];
    }

    function receiptExists(bytes32 receiptHash) external view returns (bool) {
        return _anchors[receiptHash].anchoredAt != 0;
    }
}
