// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ResearchReceiptRegistry} from "../src/ResearchReceiptRegistry.sol";

/// @notice Deploys ResearchReceiptRegistry. The pause admin is REGISTRY_OWNER if set, otherwise the deployer.
/// @dev Use an encrypted keystore, never a raw key in a file:
///        cast wallet import loxen-deployer --interactive
///        forge script script/Deploy.s.sol --rpc-url bot_mainnet --account loxen-deployer --broadcast
contract Deploy is Script {
    uint256 internal constant BOT_MAINNET = 677;
    uint256 internal constant LOCAL = 31337;

    function run() external returns (ResearchReceiptRegistry registry) {
        require(
            block.chainid == BOT_MAINNET || block.chainid == LOCAL,
            "Deploy: not BOT Chain mainnet"
        );
        address owner = vm.envOr("REGISTRY_OWNER", msg.sender);

        vm.startBroadcast();
        registry = new ResearchReceiptRegistry(owner);
        vm.stopBroadcast();

        console2.log("ResearchReceiptRegistry:", address(registry));
        console2.log("Chain ID:", block.chainid);
        console2.log("Pause admin:", owner);
        console2.log("Set NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS to the address above.");
    }
}
