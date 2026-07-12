<div align="center">

<img src="frontend/public/logo-avatar.png" alt="IntentAi Logo" width="100" />

# IntentAi — AI-Powered Cardano Transaction Terminal

**Speak your intent. IntentAi builds the transaction.**

[![Cardano](https://img.shields.io/badge/Cardano-Preprod%20%7C%20Mainnet-0033AD?logo=cardano&logoColor=white)](https://cardano.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Mesh SDK](https://img.shields.io/badge/Mesh_SDK-CIP--30-6366F1?logo=ethereum&logoColor=white)](https://meshjs.dev)
[![Aiken](https://img.shields.io/badge/Smart_Contracts-Aiken-FF6B35)](https://aiken-lang.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-green)](LICENSE)

> Built for the **Cardano Hackathon** — an AI-native DeFi terminal that converts natural language into safe, verified on-chain Cardano transactions.

</div>

---

## 🧠 What is IntentAi?

IntentAi is a **natural language to blockchain transaction system** built on Cardano. Instead of navigating complex DeFi interfaces, users describe what they want to do in plain English — and IntentAi's AI engine parses the intent, validates it for safety, and builds the exact on-chain transaction.

```
"Send 10 ADA to Alice"           →  Direct transfer to contact's wallet
"Swap 50 ADA to USDM"           →  Minswap V2 DEX order on Preprod
"Stake ADA to OCEAN pool"       →  Real on-chain delegation via Mesh SDK
"Send 5 ADA to Bob every week"  →  Recurring payment schedule (on-chain)
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗣️ **Natural Language Intents** | AI parses plain English into structured transaction blueprints |
| 🔒 **Safety Validator** | Scam detection, address validation, balance checks before any signing |
| 💱 **DEX Swap** | Minswap V2 SWAP_EXACT_IN orders with Plutus datum encoding |
| 🏦 **Staking Delegation** | Real on-chain delegation to curated validator pools |
| 📇 **Address Book** | Named contacts — "Send to Alice" resolves to her wallet address |
| 🎙️ **Voice Input** | Speech-to-text for hands-free intent entry |
| 📋 **Transaction History** | Full on-chain history with Cardanoscan links |
| 🔁 **Recurring Payments** | Scheduled ADA payments (on-chain Aiken validator) |
| 🌐 **Preprod + Mainnet** | Supports both Cardano networks |
| 🔑 **CIP-30 Wallets** | Works with Lace, Eternl, Nami, Yoroi, Flint |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│              Next.js 16 · Framer Motion · Mesh SDK              │
│   Chat Terminal · Staking Page · DeFi · Contacts · History     │
└────────────────────────────┬────────────────────────────────────┘
                             │ Natural Language Input
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI INTENT ENGINE                          │
│              Node.js + Express · Google Gemini API              │
│        Intent Parser → Safety Validator → Transaction Plan      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Validated Intent + Transaction Blueprint
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT LAYER                         │
│         Aiken Validators · Plutus Datum Builders                │
│   intent_escrow.ak · delegation_guard.ak · recurring_payment.ak │
└────────────────────────────┬────────────────────────────────────┘
                             │ Signed Transaction (CIP-30)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CARDANO BLOCKCHAIN                          │
│              Preprod Testnet · Mainnet                          │
│         wallet.signTx() → wallet.submitTx() → On-Chain         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
intentai/
├── frontend/                        # Next.js 16 frontend
│   └── src/
│       ├── app/                     # App Router pages
│       │   ├── chat/                # AI Terminal chat page
│       │   ├── stake/               # Staking delegation page
│       │   ├── defi/                # DeFi swap interface
│       │   ├── contacts/            # Address book
│       │   ├── history/             # Transaction history
│       │   └── settings/            # Wallet & network settings
│       ├── components/dashboard/    # UI components
│       │   ├── ChatSection.jsx      # AI chat terminal + tx execution
│       │   ├── StakingPage.jsx      # Pool browser + delegation
│       │   ├── ContactsPanel.jsx    # Address book management
│       │   └── TxHistory.jsx        # On-chain history viewer
│       └── context/                 # React context providers
│           ├── WalletContext.jsx     # CIP-30 wallet connection
│           └── NetworkContext.jsx   # Preprod / Mainnet switching
│
├── backend/                         # Node.js + Express API
│   └── src/
│       ├── services/
│       │   ├── aiService.js         # Google Gemini AI integration
│       │   ├── intentParser.js      # NL → structured intent
│       │   ├── transactionService.js# Transaction plan builder
│       │   ├── contactService.js    # Address book (MongoDB)
│       │   └── swapService.js       # Minswap aggregator integration
│       └── controllers/
│           ├── intentController.js  # /api/intent endpoints
│           ├── transactionController.js # /api/transaction endpoints
│           └── stakingController.js # /api/staking endpoints
│
└── smart-contracts/                 # On-chain Cardano contracts
    ├── aiken.toml                   # Aiken project manifest
    ├── index.js                     # JS off-chain datum builders
    ├── validators/
    │   ├── intent_escrow.ak         # Aiken: AI intent escrow
    │   ├── delegation_guard.ak      # Aiken: Staking whitelist guard
    │   ├── recurring_payment.ak     # Aiken: Scheduled payment validator
    │   ├── intentValidator.js       # Safety validation layer
    │   ├── minswapV2Datum.js        # Minswap V2 Plutus datum encoder
    │   └── stakingPools.js          # Pool registry + ticker resolver
    └── README.md                    # Smart contracts documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+`
- A Cardano wallet browser extension (Lace, Eternl, or Nami)
- MongoDB Atlas URI (for contacts & session persistence)
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/Mushtaq6220/intentAi.git
cd intentAi
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key
MONGODB_URI=your_mongodb_atlas_uri
BLOCKFROST_API_KEY=your_blockfrost_preprod_key
CARDANO_NETWORK=preprod
```

Start the backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/intent/parse` | Parse natural language into a transaction intent |
| `POST` | `/api/intent/stt` | Speech-to-text transcription |
| `POST` | `/api/transaction/plan` | Build a validated transaction plan |
| `POST` | `/api/transaction/swap/build` | Minswap aggregator swap builder |
| `POST` | `/api/transaction/swap/build-preprod` | Preprod Minswap V2 order datum |
| `POST` | `/api/transaction/swap/build-mainnet` | Mainnet Minswap V2 order datum |
| `POST` | `/api/transaction/submit` | Notify backend of submitted tx hash |
| `GET`  | `/api/staking/pools` | List curated staking pools |
| `GET`  | `/api/staking/pools/trending` | Top 3 pools by APY |
| `GET`  | `/api/contacts` | List address book contacts |
| `POST` | `/api/contacts` | Add a new contact |
| `DELETE` | `/api/contacts/:id` | Delete a contact |
| `GET`  | `/api/txhistory` | Get transaction history |
| `GET`  | `/health` | Backend health check |

---

## 🔗 Smart Contracts (Aiken)

IntentAi includes three **Aiken smart contract validators** in `smart-contracts/validators/`:

### `intent_escrow.ak`
Locks ADA in escrow when an AI intent is created. The receiver claims it; the sender reclaims it after a deadline. Requires AI confidence ≥ 70 to execute.

### `delegation_guard.ak`
Ensures AI-driven stake delegation only routes to IntentAi-whitelisted pool IDs. Rejects delegation to unknown pools and requires minimum AI confidence.

### `recurring_payment.ak`
Enforces scheduled ADA payment schedules parsed from natural language (daily, weekly, monthly). Locks the full budget on-chain and releases installments per epoch window.

> **Off-chain datum encoding** for Minswap V2 `SWAP_EXACT_IN` orders is handled in `smart-contracts/validators/minswapV2Datum.js`, which constructs the Plutus Data structure consumed by Minswap's deployed Aiken validator.

---

## 🏦 Supported Staking Pools

### Preprod Testnet

| Ticker | Pool Name | APY | Risk |
|--------|-----------|-----|------|
| `CSP` | Cardano Secure Pool | 5.2% | Low |
| `AINF` | ADA Infinity Validator | 5.8% | Low |
| `OCEAN` | Ocean Stake Labs | 6.4% | Medium |
| `NEBLA` | Nebula Cardano Pool | 5.7% | Low |
| `SMMT` | Summit Staking Protocol | 4.9% | Low |
| `AURORA` | Aurora Yield Farm | 7.1% | Medium |

### Mainnet

| Ticker | Pool Name | APY | Risk |
|--------|-----------|-----|------|
| `SANO` | SANO Staking | 3.5% | Low |
| `WAVE` | WAVE Validator | 3.8% | Low |

---

## 💱 Supported Swap Tokens

| Token | Network | Policy ID |
|-------|---------|-----------|
| `MIN` | Preprod + Mainnet | Minswap governance token |
| `USDM` | Preprod + Mainnet | Mehen USD stablecoin |
| `DJED` | Preprod + Mainnet | IOHK algorithmic stablecoin |
| `HOSKY` | Mainnet | Cardano community meme token |
| `WMT` | Mainnet | World Mobile Token |
| `AGIX` | Mainnet | SingularityNET AI token |

---

## 🛡️ Safety Validator

Every transaction intent goes through a **6-rule security layer** before the wallet is ever prompted:

1. **🚨 Scam Keyword Detection** — blocks "giveaway", "seed phrase", "double your ADA" etc.
2. **💰 Amount Boundary Check** — warns on >10,000 ADA, blocks zero/negative amounts
3. **✅ Token Whitelist** — only supported tokens can be transacted
4. **📍 Address Format Check** — validates bech32 Cardano address format
5. **📋 Raw Address Warning** — alerts when sending to an address not in your contact book
6. **🏦 Balance Sufficiency** — ensures wallet has enough ADA to cover amount + fees

---

## 🔑 Wallet Support (CIP-30)

| Wallet | Status |
|--------|--------|
| **Lace** | ✅ Fully supported |
| **Eternl** | ✅ Fully supported |
| **Nami** | ✅ Supported |
| **Yoroi** | ✅ Supported |
| **Flint** | ✅ Supported |

---

## 🖼️ Screenshots

> The terminal features a dark glassmorphism UI with real-time ledger pipeline status, animated transaction cards, and voice input support.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React, Framer Motion, Lucide Icons |
| **Styling** | Vanilla CSS, CSS Variables, Glassmorphism |
| **Blockchain SDK** | Mesh SDK (CIP-30, Transaction Builder) |
| **AI Engine** | Google Gemini API |
| **Backend** | Node.js, Express.js, ES Modules |
| **Database** | MongoDB Atlas |
| **Smart Contracts** | Aiken (Cardano native), Plutus V2 Datum encoding |
| **DEX Protocol** | Minswap V2 |
| **Indexer** | Blockfrost API |
| **Voice** | Web Speech API + Custom STT endpoint |

---

## 📜 License

Licensed under the **Apache 2.0 License** — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Mohammad Mushtaq**
- GitHub: [@Mushtaq6220](https://github.com/Mushtaq6220)
- Project: [github.com/Mushtaq6220/intentAi](https://github.com/Mushtaq6220/intentAi)

---

<div align="center">

**Built with ❤️ on Cardano for the Hackathon**

*Speak your intent. IntentAi does the rest.*

</div>
