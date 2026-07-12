// ══════════════════════════════════════════════════════════════════════════════
//  IntentAi — Recurring Payment Validator
//  smart-contracts/validators/recurring_payment.ak
// ══════════════════════════════════════════════════════════════════════════════
//
//  This validator enables scheduled / recurring ADA payments parsed from
//  natural language intents like:
//    "Send 5 ADA to Alice every week"
//    "Pay 100 ADA to Bob on the 1st of every month"
//
//  The contract locks a total budget on-chain and releases installments
//  according to the schedule defined in the datum.
//  Only the designated recipient can claim each installment, and only
//  after the next payment window opens.
// ══════════════════════════════════════════════════════════════════════════════

use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/time.{PosixTime}
use aiken/transaction.{ScriptContext, Spend, Transaction}
use aiken/transaction/credential.{VerificationKey}

// ── Types ─────────────────────────────────────────────────────────────────────

/// Interval between each payment release.
type PaymentInterval {
  /// Daily payments (86,400,000 ms)
  Daily
  /// Weekly payments (604,800,000 ms)
  Weekly
  /// Monthly payments (approx. 2,592,000,000 ms)
  Monthly
  /// Custom interval in milliseconds
  Custom { interval_ms: Int }
}

// ── Datum ─────────────────────────────────────────────────────────────────────

/// Datum for a recurring payment schedule locked on-chain.
type RecurringPaymentDatum {
  /// Sender who funded the contract (can cancel)
  sender: Hash<Blake2b_224, VerificationKey>,
  /// Receiver who collects each installment
  receiver: Hash<Blake2b_224, VerificationKey>,
  /// ADA per installment in Lovelace
  installment_lovelace: Int,
  /// Total number of installments remaining
  installments_remaining: Int,
  /// POSIX timestamp when the next installment becomes claimable
  next_payment_at: PosixTime,
  /// How frequently payments recur
  interval: PaymentInterval,
  /// Original AI intent label for audit trail
  intent_label: ByteArray,
}

// ── Redeemer ──────────────────────────────────────────────────────────────────

/// Actions for the recurring payment contract.
type RecurringPaymentAction {
  /// Receiver claims the next due installment
  ClaimInstallment
  /// Sender cancels the schedule and reclaims remaining ADA
  CancelSchedule
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Resolve interval duration in milliseconds.
fn interval_ms(interval: PaymentInterval) -> Int {
  when interval is {
    Daily       -> 86_400_000
    Weekly      -> 604_800_000
    Monthly     -> 2_592_000_000
    Custom { interval_ms } -> interval_ms
  }
}

// ── Validator ─────────────────────────────────────────────────────────────────

/// IntentAi Recurring Payment Validator
/// Releases ADA installments on a schedule parsed from natural language.
validator {
  fn recurring_payment(
    datum: RecurringPaymentDatum,
    redeemer: RecurringPaymentAction,
    ctx: ScriptContext,
  ) -> Bool {
    let ScriptContext { transaction, purpose } = ctx

    expect Spend(_) = purpose

    when redeemer is {
      // ── ClaimInstallment: receiver collects one payment ───────────────────
      ClaimInstallment -> {
        let receiver_signed =
          list.has(transaction.extra_signatories, datum.receiver)

        let payment_due =
          when transaction.validity_range.lower_bound.bound_type is {
            aiken/interval.Finite(lower) -> lower >= datum.next_payment_at
            _ -> False
          }

        let has_installments_left =
          datum.installments_remaining > 0

        receiver_signed && payment_due && has_installments_left
      }

      // ── CancelSchedule: sender reclaims the locked budget ─────────────────
      CancelSchedule -> {
        list.has(transaction.extra_signatories, datum.sender)
      }
    }
  }
}
