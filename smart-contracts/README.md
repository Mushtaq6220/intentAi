# IntentAi Smart Contracts

This directory contains the smart contract layer for the IntentAi Cardano AI Intent platform.

## Structure

```
smart-contracts/
├── index.js                         # Barrel export — import everything from here
├── validators/
│   ├── minswapV2Datum.js            # Minswap V2 Plutus datum builder + token registry
│   ├── stakingPools.js              # Staking pool registry + ticker resolver
│   └── intentValidator.js           # Intent safety validator (security layer)
├── plutus/                          # Aiken / Plutus compiled scripts (future)
└── scripts/                         # Deployment & interaction scripts (future)
```

---

## Validators

### `minswapV2Datum.js`
Encodes the on-chain `OrderDatum` for Minswap V2 `SWAP_EXACT_IN` orders.

**Exports:**
| Export | Type | Description |
|--------|------|-------------|
| `MINSWAP_V2_ORDER_ADDRESS_PREPROD` | `string` | Minswap V2 order script address on Preprod |
| `MINSWAP_V2_ORDER_ADDRESS_MAINNET` | `string` | Minswap V2 order script address on Mainnet |
| `PREPROD_TOKENS` | `object` | Token policy IDs for Preprod testnet |
| `MAINNET_TOKENS` | `object` | Token policy IDs for Mainnet |
| `BATCHER_FEE_LOVELACE` | `number` | Batcher fee: 2,000,000 Lovelace (2 ADA) |
| `DEPOSIT_ADA_LOVELACE` | `number` | Order deposit: 2,000,000 Lovelace (2 ADA) |
| `extractPaymentCredential(bech32Addr)` | `fn` | Extract 28-byte payment credential hex from address |
| `encodePlutusAddress(paymentKeyHash)` | `fn` | Encode wallet address as Plutus Data constructor |
| `buildMinswapV2Datum(keyHash, policyId, tokenNameHex, minOut)` | `fn` | Build full OrderDatum |

**How it works:**
1. User's bech32 wallet address → `extractPaymentCredential()` → 28-byte `paymentKeyHash`
2. Target token + minAmountOut → `buildMinswapV2Datum()` → Plutus `OrderDatum`
3. The datum is attached inline to a UTxO sent to the Minswap V2 order script address
4. Minswap's off-chain batcher detects the UTxO, matches it against a pool, and executes the swap

**Datum Schema (Aiken):**
```aiken
type OrderDatum {
  sender            : Address,          -- canceller / refund address
  receiver          : Address,          -- output after swap
  receiver_datum_hash: Option<Hash>,    -- Nothing for wallet output
  step              : OrderStep,        -- SWAP_EXACT_IN | SWAP_EXACT_OUT
  batcher_fee       : Int,              -- 2 ADA
  deposit_ada       : Int               -- 2 ADA
}

type OrderStep {
  SwapExactIn { desired_asset: Asset, minimum_receive: Int }
}
```

---

### `stakingPools.js`
Registry of curated staking validator pools for Preprod and Mainnet.

**Exports:**
| Export | Type | Description |
|--------|------|-------------|
| `PREPROD_POOLS` | `Array` | 6 preprod testnet pools |
| `MAINNET_POOLS` | `Array` | 2 mainnet live pools |
| `resolvePoolIdByTicker(ticker, isMainnet)` | `fn` | Ticker → on-chain pool ID |
| `getPoolByTicker(ticker, isMainnet)` | `fn` | Ticker → full pool metadata |
| `enrichPool(pool)` | `fn` | Adds `epochRewardPer1000` and `saturationClass` |

**Supported Pool Tickers:**

| Network | Ticker | Pool Name |
|---------|--------|-----------|
| Preprod | `CSP` | Cardano Secure Pool |
| Preprod | `AINF` | ADA Infinity Validator |
| Preprod | `OCEAN` | Ocean Stake Labs |
| Preprod | `NEBLA` | Nebula Cardano Pool |
| Preprod | `SMMT` | Summit Staking Protocol |
| Preprod | `AURORA` | Aurora Yield Farm |
| Mainnet | `SANO` | SANO Staking |
| Mainnet | `WAVE` | WAVE Validator |

**On-chain delegation flow (Mesh SDK):**
```js
import { resolvePoolIdByTicker } from "../../smart-contracts/index.js";

const poolId = resolvePoolIdByTicker("CSP", false); // preprod
const tx = new Transaction({ initiator: wallet });
tx.delegateStake(rewardAddress, poolId);
const unsignedTx = await tx.build();
const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);
```

---

### `intentValidator.js`
Security validation layer — runs before every on-chain transaction build.

**Exports:**
| Export | Type | Description |
|--------|------|-------------|
| `validateIntentSafety(intent, rawPrompt, context)` | `fn` | Full safety check |
| `isLikelyCardanoAddress(address)` | `fn` | Bech32 address format check |
| `adaToLovelace(amountAda)` | `fn` | ADA → Lovelace unit conversion |

**Validation Rules:**
1. **Scam keyword detection** — raises risk to `high` on phrases like "giveaway", "seed phrase"
2. **Amount checks** — rejects zero/negative; warns on >10,000 ADA; high risk on >50,000 ADA
3. **Token whitelist** — only `ADA, USDM, DJED, MIN, IUSD, INDIGO` allowed for transfers
4. **Address validation** — bech32 format check for receiver addresses
5. **Raw address warning** — `medium` risk if address wasn't resolved from the contact book
6. **Balance check** — fails if `amount + fee > walletBalance`

---

## Adding a New Staking Pool

1. Register the pool on-chain using the Cardano CLI or a pool operator tool.
2. Add the pool entry to `PREPROD_POOLS` or `MAINNET_POOLS` in `stakingPools.js`.
3. Add the ticker → pool ID mapping in `backend/src/services/transactionService.js` if needed for AI intent resolution.

## Adding a New Swap Token

1. Find the token's policy ID and token name hex on [cardanoscan.io](https://cardanoscan.io).
2. Add the entry to `PREPROD_TOKENS` or `MAINNET_TOKENS` in `minswapV2Datum.js`.
3. Add the token to `SUPPORTED_TOKENS` in `intentValidator.js`.

## References

- [Minswap V2 Protocol](https://github.com/minswap/minswap-dex-v2)
- [Mesh SDK Docs](https://meshjs.dev)
- [Cardano CIP-30 Wallet API](https://cips.cardano.org/cip/CIP-0030)
- [Cardanoscan Explorer](https://cardanoscan.io)
- [Preprod Cardanoscan](https://preprod.cardanoscan.io)
