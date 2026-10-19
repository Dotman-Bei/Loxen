// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ResearchReceiptRegistry} from "../src/ResearchReceiptRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract ResearchReceiptRegistryTest is Test {
    ResearchReceiptRegistry internal registry;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    bytes32 internal constant DIGEST_A = keccak256("brief A, salt 1");
    bytes32 internal constant DIGEST_B = keccak256("brief A v2, salt 2");
    uint16 internal constant SCHEMA = 1;

    event ReceiptRegistered(
        uint256 indexed receiptId, address indexed owner, bytes32 indexed digest, uint16 schemaVersion, uint64 timestamp
    );

    function setUp() public {
        registry = new ResearchReceiptRegistry(admin);
        vm.warp(1_760_000_000);
    }

    // ---------- registration ----------

    function test_RegisterStoresReceiptAndEmitsEvent() public {
        vm.expectEmit(true, true, true, true, address(registry));
        emit ReceiptRegistered(1, alice, DIGEST_A, SCHEMA, uint64(block.timestamp));

        vm.prank(alice);
        uint256 id = registry.registerReceipt(DIGEST_A, SCHEMA);

        assertEq(id, 1);
        assertEq(registry.totalReceipts(), 1);
        (address owner, bytes32 digest, uint16 schemaVersion, uint64 timestamp) = registry.getReceipt(id);
        assertEq(owner, alice);
        assertEq(digest, DIGEST_A);
        assertEq(schemaVersion, SCHEMA);
        assertEq(timestamp, uint64(block.timestamp));
    }

    function test_ReceiptIdsAreSequentialAcrossOwners() public {
        vm.prank(alice);
        assertEq(registry.registerReceipt(DIGEST_A, SCHEMA), 1);
        vm.prank(bob);
        assertEq(registry.registerReceipt(DIGEST_A, SCHEMA), 2);
        vm.prank(alice);
        assertEq(registry.registerReceipt(DIGEST_B, SCHEMA), 3);
        assertEq(registry.totalReceipts(), 3);
    }

    function test_OwnerIsTheSenderNotAnArgument() public {
        vm.prank(bob);
        uint256 id = registry.registerReceipt(DIGEST_A, SCHEMA);
        (address owner,,,) = registry.getReceipt(id);
        assertEq(owner, bob);
        assertEq(registry.receiptCount(alice), 0);
    }

    function test_RevertWhen_DigestIsEmpty() public {
        vm.prank(alice);
        vm.expectRevert(ResearchReceiptRegistry.EmptyDigest.selector);
        registry.registerReceipt(bytes32(0), SCHEMA);
    }

    function test_RevertWhen_SchemaVersionIsZero() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ResearchReceiptRegistry.UnsupportedSchema.selector, uint16(0)));
        registry.registerReceipt(DIGEST_A, 0);
    }

    // ---------- duplicates and versioning ----------

    function test_RevertWhen_SameOwnerRegistersSameDigestTwice() public {
        vm.startPrank(alice);
        uint256 first = registry.registerReceipt(DIGEST_A, SCHEMA);
        vm.expectRevert(abi.encodeWithSelector(ResearchReceiptRegistry.DuplicateDigest.selector, first));
        registry.registerReceipt(DIGEST_A, SCHEMA);
        vm.stopPrank();
        assertEq(registry.totalReceipts(), 1);
    }

    function test_NewVersionWithNewSaltCanBeRegistered() public {
        vm.startPrank(alice);
        registry.registerReceipt(DIGEST_A, SCHEMA);
        uint256 second = registry.registerReceipt(DIGEST_B, SCHEMA);
        vm.stopPrank();
        assertEq(second, 2);
        assertEq(registry.receiptCount(alice), 2);
    }

    function test_DifferentOwnersMayRegisterTheSameDigest() public {
        vm.prank(alice);
        registry.registerReceipt(DIGEST_A, SCHEMA);
        vm.prank(bob);
        registry.registerReceipt(DIGEST_A, SCHEMA);
        assertEq(registry.findReceipt(alice, DIGEST_A), 1);
        assertEq(registry.findReceipt(bob, DIGEST_A), 2);
    }

    function test_FindReceiptReturnsZeroWhenAbsent() public view {
        assertEq(registry.findReceipt(alice, DIGEST_A), 0);
    }

    // ---------- reads ----------

    function test_RevertWhen_ReceiptDoesNotExist() public {
        vm.expectRevert(abi.encodeWithSelector(ResearchReceiptRegistry.ReceiptNotFound.selector, uint256(0)));
        registry.getReceipt(0);
        vm.expectRevert(abi.encodeWithSelector(ResearchReceiptRegistry.ReceiptNotFound.selector, uint256(7)));
        registry.getReceipt(7);
    }

    function test_ReceiptsOfPagesOldestFirst() public {
        _registerMany(alice, 5);
        uint256[] memory page = registry.receiptsOf(alice, 1, 3);
        assertEq(page.length, 3);
        assertEq(page[0], 2);
        assertEq(page[1], 3);
        assertEq(page[2], 4);
    }

    function test_ReceiptsOfTruncatesAtTheEnd() public {
        _registerMany(alice, 3);
        uint256[] memory page = registry.receiptsOf(alice, 2, 10);
        assertEq(page.length, 1);
        assertEq(page[0], 3);
    }

    function test_ReceiptsOfOffsetPastEndIsEmpty() public {
        _registerMany(alice, 2);
        assertEq(registry.receiptsOf(alice, 2, 10).length, 0);
        assertEq(registry.receiptsOf(alice, type(uint256).max, 10).length, 0);
        assertEq(registry.receiptsOf(bob, 0, 10).length, 0);
    }

    function test_ReceiptsOfCapsLimitAtMaxPage() public {
        _registerMany(alice, 120);
        uint256[] memory page = registry.receiptsOf(alice, 0, type(uint256).max);
        assertEq(page.length, registry.MAX_PAGE());
        assertEq(page[99], 100);
    }

    // ---------- pause ----------

    function test_PauseBlocksRegistrationButNotReads() public {
        vm.prank(alice);
        registry.registerReceipt(DIGEST_A, SCHEMA);

        vm.prank(admin);
        registry.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        registry.registerReceipt(DIGEST_B, SCHEMA);

        (address owner,,,) = registry.getReceipt(1);
        assertEq(owner, alice);
        assertEq(registry.receiptCount(alice), 1);
        assertEq(registry.receiptsOf(alice, 0, 10).length, 1);

        vm.prank(admin);
        registry.unpause();
        vm.prank(alice);
        assertEq(registry.registerReceipt(DIGEST_B, SCHEMA), 2);
    }

    function test_RevertWhen_NonOwnerPausesOrUnpauses() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        registry.pause();

        vm.prank(admin);
        registry.pause();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        registry.unpause();
    }

    // ---------- ownership ----------

    function test_OwnershipTransferNeedsAcceptance() public {
        vm.prank(admin);
        registry.transferOwnership(bob);
        assertEq(registry.owner(), admin);
        assertEq(registry.pendingOwner(), bob);

        vm.prank(bob);
        registry.acceptOwnership();
        assertEq(registry.owner(), bob);
    }

    function test_RevertWhen_RenouncingWhilePaused() public {
        vm.startPrank(admin);
        registry.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        registry.renounceOwnership();
        vm.stopPrank();
        assertEq(registry.owner(), admin);
    }

    function test_RenounceWhileOpenLeavesRegistryPermanentlyOpen() public {
        vm.prank(admin);
        registry.renounceOwnership();
        assertEq(registry.owner(), address(0));

        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, admin));
        registry.pause();

        vm.prank(alice);
        assertEq(registry.registerReceipt(DIGEST_A, SCHEMA), 1);
    }

    // ---------- no funds ----------

    function test_RevertWhen_SendingNativeCurrency() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        (bool ok,) = address(registry).call{value: 1 wei}("");
        assertFalse(ok);
        assertEq(address(registry).balance, 0);
    }

    // ---------- fuzz ----------

    function testFuzz_RegisterThenRead(address who, bytes32 digest, uint16 schemaVersion, uint64 when) public {
        vm.assume(who != address(0));
        vm.assume(digest != bytes32(0));
        vm.assume(schemaVersion != 0);
        vm.warp(when);

        vm.prank(who);
        uint256 id = registry.registerReceipt(digest, schemaVersion);

        (address owner, bytes32 d, uint16 s, uint64 t) = registry.getReceipt(id);
        assertEq(owner, who);
        assertEq(d, digest);
        assertEq(s, schemaVersion);
        assertEq(t, when);
        assertEq(registry.findReceipt(who, digest), id);
        assertEq(registry.receiptCount(who), 1);
    }

    function _registerMany(address who, uint256 n) internal {
        vm.startPrank(who);
        for (uint256 i = 0; i < n; ++i) {
            registry.registerReceipt(keccak256(abi.encode("brief", i)), SCHEMA);
        }
        vm.stopPrank();
    }
}
