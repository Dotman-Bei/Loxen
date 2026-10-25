#!/usr/bin/env bash
# Deploys ResearchReceiptRegistry to BOT Chain MAINNET (chain 677).
# Run this yourself, in your own terminal: it asks for your keystore password and a typed confirmation.
# The private key is read from Foundry's encrypted keystore, never from a file or the command line.
#
# One-time setup:  cast wallet import loxen-mainnet --interactive
set -euo pipefail
cd "$(dirname "$0")"

RPC="${BOT_MAINNET_RPC_URL:-https://rpc.botchain.ai}"
EXPLORER="https://scan.botchain.ai"
ACCOUNT="${LOXEN_KEYSTORE_ACCOUNT:-loxen-mainnet}"
MIN_WEI=30000000000000000 # 0.03 BOT: about 1.1M gas at 20 gwei, with headroom

if ! cast wallet list 2>/dev/null | grep -q "^$ACCOUNT\b"; then
  echo "No keystore account named '$ACCOUNT'. Create it first (you will paste the key into a hidden prompt):"
  echo "  cast wallet import $ACCOUNT --interactive"
  exit 1
fi

CHAIN=$(cast chain-id --rpc-url "$RPC")
[ "$CHAIN" = "677" ] || { echo "RPC reports chain $CHAIN, expected 677 (BOT Chain mainnet). Stopping."; exit 1; }

echo "Unlocking keystore '$ACCOUNT' to read its address."
DEPLOYER=$(cast wallet address --account "$ACCOUNT")
BAL=$(cast balance "$DEPLOYER" --rpc-url "$RPC")
echo "Deployer: $DEPLOYER"
echo "Balance:  $(cast from-wei "$BAL") BOT"
if [ "$(node -e "console.log(BigInt('$BAL') < BigInt('$MIN_WEI') ? 1 : 0)")" = "1" ]; then
  echo "Needs at least 0.03 BOT for gas. Mainnet BOT is available through https://dex.botchain.ai. Stopping."; exit 1
fi

echo
echo "Pause admin: the one address that can pause and resume new receipts (it cannot edit or delete any)."
echo "Recommended: a hardware wallet or a Safe multisig. Press Enter to use the deployer address."
read -r -p "Pause admin address: " OWNER
OWNER="${OWNER:-$DEPLOYER}"
[[ "$OWNER" =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "That is not an address. Stopping."; exit 1; }
OWNER=$(cast to-check-sum-address "$OWNER")

[ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git
[ -d lib/openzeppelin-contracts ] || forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge test -q
echo "All contract tests passed."

echo
echo "About to deploy ResearchReceiptRegistry to BOT Chain MAINNET (677)"
echo "  from:        $DEPLOYER"
echo "  pause admin: $OWNER"
echo "  cost:        about 0.022 BOT in gas, paid now, not refundable"
echo "This is permanent and public."
read -r -p "Type 'deploy to mainnet' to continue: " CONFIRM
[ "$CONFIRM" = "deploy to mainnet" ] || { echo "Not confirmed. Nothing was sent."; exit 1; }

REGISTRY_OWNER="$OWNER" forge script script/Deploy.s.sol --rpc-url "$RPC" --account "$ACCOUNT" --sender "$DEPLOYER" --broadcast --slow

ADDR=$(grep -o '"contractAddress": *"0x[0-9a-fA-F]\{40\}"' broadcast/Deploy.s.sol/677/run-latest.json | head -1 | grep -o '0x[0-9a-fA-F]\{40\}')
[ -n "$ADDR" ] || { echo "Could not read the deployed address. Check broadcast/Deploy.s.sol/677/run-latest.json."; exit 1; }
ADDR=$(cast to-check-sum-address "$ADDR")

forge verify-contract "$ADDR" src/ResearchReceiptRegistry.sol:ResearchReceiptRegistry \
  --chain-id 677 --verifier blockscout --verifier-url "$EXPLORER/api/" \
  --constructor-args "$(cast abi-encode "constructor(address)" "$OWNER")" --watch \
  || echo "Verification did not complete; the contract is deployed. Retry verification later."

echo
echo "Registry deployed on mainnet: $ADDR"
echo "Explorer: $EXPLORER/address/$ADDR"
echo
echo "Set these in Vercel (Project > Settings > Environment Variables), then redeploy:"
echo "  NEXT_PUBLIC_LOXEN_CHAIN=mainnet"
echo "  NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS=$ADDR"
