# Transfer + Issue Flow (Source of Truth)

This document defines the transfer lifecycle, who can change each status, when stock moves, and how issues are settled.

## 1) Core Models

- `InventoryTransfer`: transfer request + lifecycle milestones.
- `TransferIssue`: one issue record per problematic variant and issue type (`damaged`, `missing`, `extra`).

`InventoryTransfer` keeps:
- transfer state (`status`)
- delivery settlement fields per item (`receivedQuantity`, `acceptedQuantity`, `damagedQuantity`, `missingQuantity`, `extraQuantity`)
- issue rollup (`hasIssues`, `issuesCount`)

`TransferIssue` keeps:
- issue details (`variant`, `issueType`, `quantity`, `note`)
- issue lifecycle (`reported` -> `under_review` -> `resolved`)
- resolution details (`adjust`, `replace`, `return`)

## 2) Transfer Status Lifecycle

Main flow:

`initiated -> approved -> shipped -> delivered -> (completed OR issue_reported)`

Terminal states:
- `rejected`
- `cancelled`
- `completed`

## 3) Actor Permissions Per Status Change

- `approved`, `rejected`: destination actor only (`toType`/`toId`)
- `shipped`: source actor only (`fromType`/`fromId`)
- `delivered`: destination actor only
- `issue_reported`, `completed`: destination actor only, and only when current status is `delivered`
- `cancelled`:
  - from `initiated`: source only
  - from `approved`: source or destination

No actor can move status outside valid transition graph.

## 4) Stock Movement Rules

### A) On `shipped`

Reserve stock at source for each transfer item:
- source `reserved += sentQuantity`
- source `available -= sentQuantity`
- source `quantity` unchanged

### B) On `delivered`

No stock movement.  
This is only a delivery milestone.

### C) On `completed` OR `issue_reported` (finalization step)

Settlement payload (`items`) is mandatory and validated.

For each variant:
- enforce:
  - `received = accepted + damaged`
  - `received = sent - missing + extra`
- source finalization:
  - `reserved -= sent`
  - `quantity -= sent`
- destination credit now:
  - `quantity += accepted`

Then:
- if **all variants strict-match** (`sent=received=accepted`, and `damaged=missing=extra=0`) => status can be `completed`
- if **any mismatch** exists => must be `issue_reported` and issue records are created

## 5) Strict Completed Criteria

`completed` is allowed only if every item satisfies:

- `receivedQuantity === sentQuantity`
- `acceptedQuantity === sentQuantity`
- `damagedQuantity === 0`
- `missingQuantity === 0`
- `extraQuantity === 0`

If any item violates this, request must go through `issue_reported`.

## 6) Issue Creation Logic

During `issue_reported` finalization:

For each transfer item:
- create `TransferIssue` for each non-zero bucket:
  - `damagedQuantity > 0` => issue type `damaged`
  - `missingQuantity > 0` => issue type `missing`
  - `extraQuantity > 0` => issue type `extra`

Transfer rollup is synced:
- `hasIssues = true`
- `issuesCount = number of unresolved issues`

## 7) Issue Resolution and Inventory Impact

Issue status flow:
- `reported -> under_review -> resolved`

When issue is resolved, resolution type controls stock behavior:

- `adjust`:
  - bookkeeping correction, no extra physical move expected
  - may update final accepted handling per business decision

- `replace`:
  - replacement units are sent/received later
  - stock impact should happen when replacement is actually fulfilled

- `return`:
  - units are returned back to source
  - reverse movement for returned quantity

After each resolve:
- recalculate unresolved issues for the transfer
- update `hasIssues` / `issuesCount`
- if unresolved issues become `0`, transfer auto-transitions to `completed`

## 8) Validation Formulas (Must Always Hold)

Per item settlement:

1. `received = accepted + damaged`
2. `received = sent - missing + extra`

These two formulas guarantee consistency from both physical inspection and sent-vs-delta reconciliation.

## 9) Real Example (3 Variants)

Transfer created with sent quantities:
- A: 10
- B: 8
- C: 5

### Step 1: `shipped`
- source reserves (10 + 8 + 5)

### Step 2: `delivered`
- no stock mutation

### Step 3: settlement submitted as `issue_reported`

- A: accepted 10, damaged 0, missing 0, extra 0, received 10
- B: accepted 6, damaged 1, missing 1, extra 0, received 7
- C: accepted 5, damaged 0, missing 0, extra 1, received 6

Checks:
- B: `7 = 6 + 1`, and `7 = 8 - 1 + 0` ✅
- C: `6 = 5 + 0`, and `6 = 5 - 0 + 1` ✅

Stock at finalization:
- source: reserved reduced by sent totals, quantity reduced by sent totals
- destination: quantity increased by accepted totals only (10 + 6 + 5)

Issues created:
- B missing(1), B damaged(1), C extra(1)

Transfer remains `issue_reported` until all 3 issues are resolved.

### Step 4: issue resolutions

As each issue moves to `resolved`, rollup decreases.  
When unresolved count reaches 0, transfer auto moves to `completed`.

## 10) UI Contract (Frontend)

Frontend should render actions from backend `allowedStatuses` only.

Special handling:
- after `delivered`, do not show generic status modal action
- show direct actions/buttons:
  - `Mark Completed`
  - `Report Issue`
- if reporting/completing from delivered stage, open settlement form and submit per-item quantities

For transfers in `issue_reported`:
- show `View Issues (N)` and handle workflows in issue pages, not transfer status modal.

## 11) Why This Split Works

- transfer lifecycle remains simple and auditable
- issue lifecycle is independent and granular
- stock movement is deterministic and tied to explicit business checkpoints
- automatic completion after issue resolution avoids manual drift
