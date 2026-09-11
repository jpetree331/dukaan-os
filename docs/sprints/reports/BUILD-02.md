# BUILD-02 — Awaitable commands and storage

Status at build checkpoint: **built-unverified**. Code `f89d5f602de069f3d3f2e0c531d72f7c6cfbee4a`. Predecessor VERIFY-01 push confirmed at `a286362458bd9ecb89ae6ab36f5e2620e75675a4`. Date: 11 September 2026.

## Changes and reason

Added an awaitable localStorage repository and converted public book mutations and their UI callers to wait for durability. While saving, selectors expose the prior committed book; the pending draft becomes visible only after the repository accepts it. A failed write restores the previous state. Additional actions/account switches are blocked, and the repository rechecks writer/context immediately before writing. Locking invalidates a delayed operation. The shell and dialogs show busy state; routing and rendering cannot advertise an uncommitted result.

Numeric-keypad callbacks now forward their promises, keeping payment dialogs open until the mutation succeeds. Charge waits before receipt/cart clearing, and duplicate pending charge clicks are ignored. Settings language/theme, cash reconciliation, restore/reload and login migration await their relevant writes. Credentials/session/throttle metadata remains in the existing local registry. The [caller inventory](../ASYNC-CALLERS.md) documents every surface, migration exceptions and recovery boundaries.

## Builder checks and defects found during development

Final module run: **49 passed, 0 failed**. This includes delayed sale/double-submission checks, delayed rejection across all six money/stock actions plus settings, lock-before-commit, account-switch rejection, and failed awaited migration preserving its source. Earlier BUILD-01 arithmetic/quantity tests still pass after their callers were converted to await.

The browser run passed **11 groups**, including a delayed UI sale: no new bill/stock/receipt before release, busy shell, blocked navigation, and exactly one charge after a second click. It also repeated backup/password/PIN/restore checks. This run preceded final theme/cash-result timing and startup-hook refinements; VERIFY-02 repeats it on the committed tree rather than claiming those refinements were browser-tested here.

`npm run build` passed at `dfa3b24fd3c4118197d6`; plan and whitespace checks passed. An initial draft lost object-reference continuity when restoring staged data; regression tests exposed it, and the accepted draft now preserves existing references. Automated await conversion also misplaced `.catch` on resolved values; browser error evidence caught that and the callers were corrected. These development failures are resolved in this build, not omitted from the report.

## Scope, compatibility and remaining uncertainty

No database/backup schema change or IndexedDB cutover. No provider, deployment or merge. Public mutation APIs now return promises; outside scripts must await them. The adapter does not solve a browser dying after a physical write but before acknowledgement, durable idempotency, or cross-device ordering. Login/account deletion remains a recoverable multi-key workflow rather than a single transaction across credentials and books. D03/D04 later sprints retain those obligations.

Due seam: **SEAM-01-02**, checked by VERIFY-02 on this exact application code. Earlier arithmetic evidence must be re-established through delayed commit/failure/reload paths. Independent review: **None**. Outstanding physical phone/PWA/printer evidence remains unchanged. Push the build/report before the separate verification result.
