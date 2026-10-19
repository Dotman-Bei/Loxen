// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title ResearchReceiptRegistry
/// @notice Records that a wallet committed a digest of a Loxen research brief at a block.
/// @dev What this contract proves: `owner` submitted `digest` under `schemaVersion` at `timestamp`.
///      What it does not prove: that the brief is accurate, that its sources were honest, or who
///      controls the wallet. It stores no brief text, holds no funds, issues no token, and receipts
///      cannot be transferred.
///
///      Admin scope: the owner can only pause and unpause new registrations (for an emergency such
///      as a broken frontend committing malformed digests). Reads are never paused, and no admin
///      function can edit or delete a receipt.
contract ResearchReceiptRegistry is Ownable2Step, Pausable {
    /// @dev One slot for owner, timestamp and schema version; one for the digest.
    struct Receipt {
        address owner;
        uint64 timestamp;
        uint16 schemaVersion;
        bytes32 digest;
    }

    /// @notice Largest page `receiptsOf` returns, so no read loops without bound.
    uint256 public constant MAX_PAGE = 100;

    /// @notice Number of receipts ever registered. Receipt IDs run from 1 to this value.
    uint256 public totalReceipts;

    mapping(uint256 receiptId => Receipt) private _receipts;
    mapping(address owner => uint256[] receiptIds) private _byOwner;
    mapping(address owner => mapping(bytes32 digest => uint256 receiptId)) private _byOwnerDigest;

    event ReceiptRegistered(
        uint256 indexed receiptId,
        address indexed owner,
        bytes32 indexed digest,
        uint16 schemaVersion,
        uint64 timestamp
    );

    error EmptyDigest();
    error UnsupportedSchema(uint16 schemaVersion);
    error DuplicateDigest(uint256 existingReceiptId);
    error ReceiptNotFound(uint256 receiptId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Record a digest for the calling wallet.
    /// @dev The same owner cannot register the same digest twice. A new version of a brief uses a
    ///      fresh salt, so its digest differs and it can always be registered. Different owners may
    ///      register the same digest; each receipt is bound to its own sender.
    /// @param digest keccak256 of the salted, canonical brief envelope (see Loxen's methodology).
    /// @param schemaVersion The brief schema version the digest was computed under (1 for loxen.brief/1).
    /// @return receiptId The new receipt's ID.
    function registerReceipt(bytes32 digest, uint16 schemaVersion) external whenNotPaused returns (uint256 receiptId) {
        if (digest == bytes32(0)) revert EmptyDigest();
        if (schemaVersion == 0) revert UnsupportedSchema(schemaVersion);
        uint256 existing = _byOwnerDigest[msg.sender][digest];
        if (existing != 0) revert DuplicateDigest(existing);

        receiptId = ++totalReceipts;
        uint64 timestamp = uint64(block.timestamp);
        _receipts[receiptId] = Receipt({owner: msg.sender, timestamp: timestamp, schemaVersion: schemaVersion, digest: digest});
        _byOwner[msg.sender].push(receiptId);
        _byOwnerDigest[msg.sender][digest] = receiptId;

        emit ReceiptRegistered(receiptId, msg.sender, digest, schemaVersion, timestamp);
    }

    /// @notice A receipt by ID. Reverts with `ReceiptNotFound` for an ID that was never issued.
    function getReceipt(uint256 receiptId)
        external
        view
        returns (address owner, bytes32 digest, uint16 schemaVersion, uint64 timestamp)
    {
        Receipt storage r = _receipts[receiptId];
        if (r.owner == address(0)) revert ReceiptNotFound(receiptId);
        return (r.owner, r.digest, r.schemaVersion, r.timestamp);
    }

    /// @notice How many receipts `owner` has registered.
    function receiptCount(address owner) external view returns (uint256) {
        return _byOwner[owner].length;
    }

    /// @notice A page of `owner`'s receipt IDs, oldest first. `limit` is capped at `MAX_PAGE`;
    ///         an offset past the end returns an empty array.
    function receiptsOf(address owner, uint256 offset, uint256 limit) external view returns (uint256[] memory ids) {
        uint256[] storage all = _byOwner[owner];
        uint256 len = all.length;
        if (offset >= len) return new uint256[](0);
        if (limit > MAX_PAGE) limit = MAX_PAGE;
        uint256 end = offset + limit > len ? len : offset + limit;
        ids = new uint256[](end - offset);
        for (uint256 i = offset; i < end; ++i) {
            ids[i - offset] = all[i];
        }
    }

    /// @notice The receipt ID `owner` registered for `digest`, or 0 if there is none.
    function findReceipt(address owner, bytes32 digest) external view returns (uint256) {
        return _byOwnerDigest[owner][digest];
    }

    /// @notice Stop new registrations in an emergency. Reads keep working.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resume registrations.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Giving up ownership is allowed only while registrations are open, so the registry
    ///         can never be left paused with nobody able to resume it.
    function renounceOwnership() public override onlyOwner whenNotPaused {
        super.renounceOwnership();
    }
}
