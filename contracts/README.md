# ResearchReceiptRegistry

The on-chain half of Loxen: a small registry that records that a wallet committed a digest of a
research brief at a block. It is optional. Everything else in Loxen works without it.

## What it proves, and what it does not

| A receipt proves | A receipt does not prove |
| --- | --- |
| The sending wallet submitted this exact `digest` | That the brief is accurate or its sources honest |
| It did so at this block and block time | That any value in the brief was live |
| Under this brief `schemaVersion` | Who controls the wallet |
| Given the brief and salt, anyone can recompute the digest | Anything about returns. A receipt has no value |

The contract stores no brief text, notes or salt, holds no funds (sending it native currency
reverts), issues no token, and receipts cannot be transferred.

## Interface

```solidity
function registerReceipt(bytes32 digest, uint16 schemaVersion) returns (uint256 receiptId);
function getReceipt(uint256 receiptId) view returns (address owner, bytes32 digest, uint16 schemaVersion, uint64 timestamp);
function receiptCount(address owner) view returns (uint256);
function receiptsOf(address owner, uint256 offset, uint256 limit) view returns (uint256[]); // limit capped at 100
function findReceipt(address owner, bytes32 digest) view returns (uint256);                 // 0 when absent
function totalReceipts() view returns (uint256);

event ReceiptRegistered(uint256 indexed receiptId, address indexed owner, bytes32 indexed digest, uint16 schemaVersion, uint64 timestamp);

error EmptyDigest();
error UnsupportedSchema(uint16 schemaVersion);   // schemaVersion 0
error DuplicateDigest(uint256 existingReceiptId); // same owner, same digest
error ReceiptNotFound(uint256 receiptId);
```

The frontend's copy of this ABI lives in `src/lib/registry.ts`. After any contract change, run
`forge build` here and then `npm run check:abi` at the project root; it fails if the two disagree.

## Design decisions

- **Receipt IDs** are sequential from 1. They are deterministic and cannot collide; the digest is
  the collision-resistant part (keccak256 over the salted, canonical brief envelope, described on
  the Methodology page).
- **Duplicates.** One owner cannot register the same digest twice. A new version of a brief gets a
  fresh salt and therefore a new digest, so versioning is never blocked. Two different wallets may
  register the same digest; each receipt is bound to its own sender.
- **Bounded reads.** No call loops over unbounded data. `receiptsOf` pages at most 100 IDs; history
  views read `ReceiptRegistered` events.
- **Owner is `msg.sender`**, never an argument, so nobody can register on another wallet's behalf.
- **EVM target `paris`**, to avoid the `PUSH0` opcode in case BOT Chain has not adopted Shanghai.
  Revisit once the chain's EVM version is confirmed in its developer docs.

## Admin scope

The deployer (or `REGISTRY_OWNER`) can only `pause()` and `unpause()` new registrations, for an
emergency such as a broken frontend committing malformed digests. Reads are never paused. No admin
function can edit, delete or move a receipt. Ownership moves in two steps (`transferOwnership`, then
`acceptOwnership`). Renouncing ownership is refused while paused, so the registry can never be
stranded in a paused state.

## Threat model (short)

| Threat | Handling |
| --- | --- |
| Someone claims a receipt certifies their research | The contract and every Loxen screen state that it proves registration only |
| A private brief leaks through the chain | Only a salted digest is stored; without the brief and salt it cannot be reversed or guessed |
| Front-running a digest | Pointless: the receipt is bound to the sender, so a copier gets their own receipt, not yours |
| Spam registrations | Each costs the sender gas and touches only their own storage; reads stay bounded |
| Owner key compromise | The worst outcome is a paused registry; receipts cannot be altered. Use a hardware wallet or multisig as owner |
| Reentrancy | No external calls and no value transfers |
| Frontend shows success that did not happen | Success is shown only after a confirmed receipt with a decoded `ReceiptRegistered` event (tested end to end) |

## Tests

```
forge test            # 21 tests, including a 512-run fuzz test
forge test --gas-report
```

Covered: registration and event fields, sequential IDs, sender binding, empty digest and schema 0,
duplicate rejection and versioning, same digest across owners, missing receipts, paging bounds and
the 100 cap, pause and unpause (reads still work), owner-only admin, two-step ownership, no renounce
while paused, rejected native currency, and a fuzz test of register-then-read.

Measured gas: `registerReceipt` about 160,000 for a wallet's first receipt; deployment about
841,000.

## Deploying

1. Confirm the network values against the official guide:
   https://dev-docs.botchain.ai/docs/Developers/quick-guide/ (as of this writing: testnet chain 968,
   RPC `https://rpc.bohr.life`; mainnet chain 677, RPC `https://rpc.botchain.ai`).
2. Install the libraries (they are not committed): `forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git`
3. Store the deployer key in an encrypted keystore, never in a file:
   `cast wallet import loxen-deployer --interactive`
4. Deploy (the script refuses any chain but 968, 677 or a local node):
   ```
   export BOT_TESTNET_RPC_URL=https://rpc.bohr.life
   # optional: export REGISTRY_OWNER=0x… (a multisig or hardware wallet for the pause switch)
   forge script script/Deploy.s.sol --rpc-url bot_testnet --account loxen-deployer --broadcast
   ```
5. Verify the source on BOTScan, then set `NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS` (and
   `NEXT_PUBLIC_LOXEN_CHAIN`) for the web app. See `.env.example` at the project root.

## Local end-to-end run

```
anvil
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --unlocked \
  --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast
# then, at the project root, a second server beside `npm run dev`:
NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_LOXEN_CHAIN=local NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS=0x… npx next dev -p 3300
```
