#!/usr/bin/env bash
# Deploys ResearchReceiptRegistry to BOT Chain testnet using contracts/.env, verifies it on BOTScan,
# and writes the address into the web app's .env.local. The private key is never printed.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "contracts/.env is missing."; exit 1; }
set -a; source .env; set +a

KEY="${PRIVATE_KEY:-}"
KEY="${KEY#0x}"
if ! [[ "$KEY" =~ ^[0-9a-fA-F]{64}$ ]]; then
  echo "PRIVATE_KEY in contracts/.env is empty or not a 64-character hex key."; exit 1
fi
KEY="0x$KEY"
RPC="${BOT_TESTNET_RPC_URL:?}"
EXPLORER="${BOT_TESTNET_EXPLORER:?}"

CHAIN=$(cast chain-id --rpc-url "$RPC")
[ "$CHAIN" = "968" ] || { echo "RPC reports chain $CHAIN, expected 968 (BOT Chain testnet). Stopping."; exit 1; }

DEPLOYER=$(cast wallet address --private-key "$KEY")
BALANCE=$(cast balance "$DEPLOYER" --rpc-url "$RPC" --ether)
echo "Deployer:  $DEPLOYER"
echo "Balance:   $BALANCE BOT"
echo "Pause admin: ${REGISTRY_OWNER:-$DEPLOYER (deployer)}"
if [ "$(cast balance "$DEPLOYER" --rpc-url "$RPC")" = "0" ]; then
  echo "This wallet has no testnet BOT. Fund it at https://faucet.botchain.ai/basic and run again."; exit 1
fi

[ -d lib/forge-std ] || forge install foundry-rs/forge-std --no-git
[ -d lib/openzeppelin-contracts ] || forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git

forge test -q
echo "Tests passed. Deploying…"
forge script script/Deploy.s.sol --rpc-url "$RPC" --private-key "$KEY" --sender "$DEPLOYER" --broadcast --slow

ADDR=$(grep -o '"contractAddress": *"0x[0-9a-fA-F]\{40\}"' broadcast/Deploy.s.sol/968/run-latest.json | head -1 | grep -o '0x[0-9a-fA-F]\{40\}')
[ -n "$ADDR" ] || { echo "Could not read the deployed address from the broadcast file."; exit 1; }
ADDR=$(cast to-check-sum-address "$ADDR")
echo "Registry deployed at $ADDR"
echo "Explorer: $EXPLORER/address/$ADDR"

OWNER_ARG=$(cast abi-encode "constructor(address)" "${REGISTRY_OWNER:-$DEPLOYER}")
forge verify-contract "$ADDR" src/ResearchReceiptRegistry.sol:ResearchReceiptRegistry \
  --chain-id 968 --verifier blockscout --verifier-url "$EXPLORER/api/" \
  --constructor-args "$OWNER_ARG" --watch \
  || echo "Verification did not complete; the contract is deployed. Retry verification later."

ENV_LOCAL=../.env.local
touch "$ENV_LOCAL"
grep -v '^NEXT_PUBLIC_LOXEN_CHAIN=\|^NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS=' "$ENV_LOCAL" > "$ENV_LOCAL.tmp" || true
{ cat "$ENV_LOCAL.tmp"; echo "NEXT_PUBLIC_LOXEN_CHAIN=testnet"; echo "NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS=$ADDR"; } > "$ENV_LOCAL"
rm -f "$ENV_LOCAL.tmp"
echo "Wrote the registry address to .env.local. Restart the dev server to pick it up."
