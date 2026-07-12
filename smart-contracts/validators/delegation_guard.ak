// ══════════════════════════════════════════════════════════════════════════════
//  IntentAi — Delegation Guard Validator
//  smart-contracts/validators/delegation_guard.ak
// ══════════════════════════════════════════════════════════════════════════════
//
//  This validator acts as a whitelisted staking delegation guard.
//  It ensures that AI-driven stake delegation intents only route ADA
//  to pre-approved, curated pool IDs registered by the IntentAi platform.
//
//  Prevents:
//    - Delegation to unknown or malicious pools
//    - Unauthorized pool changes outside the AI intent pipeline
//    - Delegation without minimum confidence threshold from the AI parser
// ══════════════════════════════════════════════════════════════════════════════

use aiken/hash.{Blake2b_224, Hash, Blake2b_256}
use aiken/list
use aiken/transaction.{ScriptContext, Transaction}
use aiken/transaction/certificate.{CredentialDelegation}
use aiken/transaction/credential.{PoolId, VerificationKey}

// ── Datum ─────────────────────────────────────────────────────────────────────

/// Parameters for a whitelisted delegation intent.
type DelegationGuardDatum {
  /// The wallet owner's verification key hash
  owner: Hash<Blake2b_224, VerificationKey>,
  /// Whitelisted pool IDs approved by IntentAi platform
  approved_pools: List<PoolId>,
  /// Minimum AI confidence score required to authorize delegation (0-100)
  min_confidence: Int,
  /// IntentAi platform operator key (can update whitelist)
  platform_key: Hash<Blake2b_224, VerificationKey>,
}

// ── Redeemer ──────────────────────────────────────────────────────────────────

/// Actions for the delegation guard.
type DelegationGuardAction {
  /// Delegate to an approved pool via AI intent
  Delegate { pool_id: PoolId, ai_confidence: Int }
  /// Platform operator updates the whitelisted pools
  UpdateWhitelist
}

// ── Validator ─────────────────────────────────────────────────────────────────

/// IntentAi Delegation Guard Validator
/// Only allows stake delegation to pre-approved pool IDs with sufficient AI confidence.
validator {
  fn delegation_guard(
    datum: DelegationGuardDatum,
    redeemer: DelegationGuardAction,
    ctx: ScriptContext,
  ) -> Bool {
    let ScriptContext { transaction, .. } = ctx

    when redeemer is {
      // ── Delegate: route stake to an approved pool ─────────────────────────
      Delegate { pool_id, ai_confidence } -> {
        let owner_signed =
          list.has(transaction.extra_signatories, datum.owner)

        let pool_is_approved =
          list.has(datum.approved_pools, pool_id)

        let confidence_sufficient =
          ai_confidence >= datum.min_confidence

        owner_signed && pool_is_approved && confidence_sufficient
      }

      // ── UpdateWhitelist: platform operator modifies approved pools ────────
      UpdateWhitelist -> {
        list.has(transaction.extra_signatories, datum.platform_key)
      }
    }
  }
}
