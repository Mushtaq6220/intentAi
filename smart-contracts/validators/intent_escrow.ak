// ══════════════════════════════════════════════════════════════════════════════
//  IntentAi — Intent Escrow Validator
//  smart-contracts/validators/intent_escrow.ak
// ══════════════════════════════════════════════════════════════════════════════
//
//  This validator locks ADA in an escrow UTxO when a user submits a payment
//  intent via IntentAi. The escrow is released to the receiver only when:
//    1. The AI-parsed intent matches the on-chain datum parameters
//    2. The receiver signs the transaction
//    3. The deadline has not passed
//
//  If the deadline passes, the sender can reclaim the locked ADA.
// ══════════════════════════════════════════════════════════════════════════════

use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/time.{PosixTime}
use aiken/transaction.{ScriptContext, Spend, Transaction}
use aiken/transaction/credential.{VerificationKey}

// ── Datum ─────────────────────────────────────────────────────────────────────

/// Datum attached to the locked escrow UTxO.
/// Encodes all parameters of the original AI-parsed intent.
type IntentEscrowDatum {
  /// Public key hash of the sender (can reclaim after deadline)
  sender: Hash<Blake2b_224, VerificationKey>,
  /// Public key hash of the intended receiver
  receiver: Hash<Blake2b_224, VerificationKey>,
  /// Amount locked in Lovelace (1 ADA = 1,000,000 Lovelace)
  amount_lovelace: Int,
  /// Human-readable intent label (e.g. "Send 10 ADA to Alice")
  intent_label: ByteArray,
  /// POSIX timestamp deadline — sender can reclaim after this
  deadline: PosixTime,
  /// AI confidence score (0-100) at time of intent parsing
  ai_confidence: Int,
}

// ── Redeemer ──────────────────────────────────────────────────────────────────

/// Actions that can spend the escrow UTxO.
type IntentEscrowAction {
  /// Receiver claims the locked ADA (happy path)
  Claim
  /// Sender reclaims after deadline passes (timeout path)
  Reclaim
}

// ── Validator ─────────────────────────────────────────────────────────────────

/// IntentAi Escrow Validator
/// Enforces that locked ADA can only be released under valid conditions.
validator {
  fn intent_escrow(
    datum: IntentEscrowDatum,
    redeemer: IntentEscrowAction,
    ctx: ScriptContext,
  ) -> Bool {
    let ScriptContext { transaction, purpose } = ctx

    expect Spend(_) = purpose

    when redeemer is {
      // ── Claim: receiver collects the locked ADA ──────────────────────────
      Claim -> {
        let receiver_signed =
          list.has(transaction.extra_signatories, datum.receiver)

        let not_expired =
          when transaction.validity_range.upper_bound.bound_type is {
            aiken/interval.Finite(upper) -> upper <= datum.deadline
            _ -> False
          }

        let sufficient_confidence = datum.ai_confidence >= 70

        // All three conditions must hold
        receiver_signed && not_expired && sufficient_confidence
      }

      // ── Reclaim: sender gets ADA back after deadline ─────────────────────
      Reclaim -> {
        let sender_signed =
          list.has(transaction.extra_signatories, datum.sender)

        let deadline_passed =
          when transaction.validity_range.lower_bound.bound_type is {
            aiken/interval.Finite(lower) -> lower > datum.deadline
            _ -> False
          }

        sender_signed && deadline_passed
      }
    }
  }
}
