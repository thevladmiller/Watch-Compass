# Codex Workflows — board draft

Snapshot: 2026-10-10. Intended destination: a private Trello board.

- Prepared from nine project entries and recent visible Codex chats. Not a complete archive audit.

- List placement and next steps are suggested from the latest available evidence. An idle chat does not mean its project is complete.

- No deadlines, assignments, paid features, automations, or live synchronization configured.

- Personal-admin cards intentionally omit contact details, financial amounts, and legal or medical content.

- Not yet created in Trello: account connection required.

## Workflow

Backlog → Ready → In progress → Review → Done. Use Waiting when an external reply, access, verification, or user input is needed.

Labels identify the project; each card contains evidence, a next action, and a completion checklist.

## Backlog

### CW-01 · Choose Forager deployment target and Terraform integration
Project: Infrastructure
Evidence: The latest discussion presents deployment options; implementation is not confirmed.
Next action: Choose where Forager will run, then define non-secret infrastructure outputs and deployment configuration.
Source: [Open Codex chat](codex://threads/019e458b-88c1-7a03-82af-e7c3e809f5ab)
- [ ] Confirm deployment target
- [ ] Define non-secret Terraform outputs
- [ ] Wire deployment secrets through the deployment environment
- [ ] Verify state storage versioning and encryption

### CW-02 · Resume smartwatch platform integration
Project: Watch Compass
Evidence: Native code exists under native/. The local README describes shared navigation, UI, and platform adapters; current device readiness is unconfirmed.
Next action: Review platform adapter and app-shell completeness, then choose a real-device acceptance test.
Source: [Open Codex chat](codex://threads/019f5380-5b6e-7a60-b18c-37f63e6808a8)
- [ ] Review watchOS and Wear OS implementation
- [ ] Choose first target device
- [ ] Test marking a start point and returning
- [ ] Measure direction and distance drift

## Ready

### CW-03 · Verify fixed-layout web flow on a physical Kilter board
Project: Kilterr
Evidence: Both local web builds pass automated checks. The October 10 refresh did not establish new physical verification.
Next action: Use a supported Original 12×12 with kickboard, Bolt Ons + Screw Ons board and record the physical result.
Source: [Open Codex chat](codex://threads/01a11096-996b-7c21-836f-b5326510af9b)
- [ ] Verify physical layout matches the shipped mapping
- [ ] Connect and confirm no board/angle selectors appear
- [ ] Select grade and spin
- [ ] Disconnect and reconnect without LED replay
- [ ] Use SHOW CLIMB and verify the expected holds

### CW-04 · Complete installed macOS discovery acceptance
Project: Career OS
Evidence: Discovery repair and release build passed automated verification; an exact Launch Services source-scan click remains a human acceptance check.
Next action: Launch the final release app and exercise both discovery controls.
Source: [Open Codex chat](codex://threads/019fa3b5-e5c4-7df1-9a5e-829b6f04e44d)
- [ ] Launch release app
- [ ] Click source Scan now
- [ ] Click Run discovery
- [ ] Confirm progress and review queue persist after restart
- [ ] Confirm no browser windows open

### CW-05 · Review and publish the prepared LinkedIn launch post
Project: Millco
Evidence: The recent chat contains a prepared onboarding/offboarding automation post. Nothing has been posted.
Next action: Review the draft and choose when to publish it. Publishing is a separate action.
Source: [Open Codex chat](codex://threads/01a0fcb9-ca22-7c71-b7d1-91b697bd9361)
- [ ] Review the existing draft
- [ ] Check the service-page link
- [ ] Choose publication time
- [ ] Publish after review

## In progress

### CW-06 · Continue job application pipeline
Project: Job search
Evidence: The application summary was updated on October 10. The workflow is ongoing; the chat itself is idle.
Next action: Review open applications and select the next suitable roles.
Source: [Open Codex chat](codex://threads/01a0fcb9-ca22-7c71-b7d1-91b697bd9361)
- [ ] Review the current application summary
- [ ] Select next roles against established criteria
- [ ] Prepare role-specific materials
- [ ] Record submissions and replies

### CW-07 · Monitor website indexing coverage
Project: Millco
Evidence: Bing sitemap and 22 URLs were submitted. Google indexing was requested for the Dutch homepage and three service pages; service pages and coverage reporting remain pending.
Next action: Check indexing coverage and record which service pages are indexed.
Source: [Open Codex chat](codex://threads/01a0fcb9-ca22-7c71-b7d1-91b697bd9361)
- [ ] Check Google coverage once reporting is available
- [ ] Verify Dutch service-page indexing
- [ ] Check Bing sitemap status

## Waiting

### CW-08 · Native iPhone physical checkpoint before Solo integration
Project: Kilterr
Evidence: Latest project review says the native iPhone checkpoint is unchanged and physical iOS verification gates native Solo integration.
Next action: Complete and record the native iPhone hardware acceptance checklist.
Source: [Open Codex chat](codex://threads/01a11096-996b-7c21-836f-b5326510af9b)
- [ ] Run documented iPhone physical acceptance
- [ ] Record connection and LED results
- [ ] Resolve any observed failures
- [ ] Proceed with native Solo integration only after acceptance

### CW-09 · Confirm scheduling for bGrid next round
Project: Job search
Evidence: The user reported a next round; the latest check found no new scheduling email.
Next action: Check for scheduling details and record the confirmed date.
Source: [Open Codex chat](codex://threads/01a0fcb9-ca22-7c71-b7d1-91b697bd9361)
- [ ] Check for scheduling reply
- [ ] Record confirmed interview details
- [ ] Prepare for next round

### CW-10 · Resolve repository push access
Project: Watch Compass
Evidence: Latest chat discussed write-authentication issues for the Watch-Compass repository; successful push is not confirmed.
Next action: Verify repository write access and whether the push has since succeeded.
Source: [Open Codex chat](codex://threads/019f5380-5b6e-7a60-b18c-37f63e6808a8)
- [ ] Confirm correct repository
- [ ] Verify write access
- [ ] Confirm local changes are pushed

### CW-11 · Complete outstanding broker-removal steps
Project: Personal admin
Evidence: No removals were confirmed. Verification and required user inputs remain outstanding.
Next action: Review the original chat and complete the outstanding verification or authorization steps.
Source: [Open Codex chat](codex://threads/01a106bb-7995-7520-9422-bc9a15d2304d)
- [ ] Complete pending verification
- [ ] Provide required form input in the original workflow
- [ ] Resolve outstanding authorization
- [ ] Record confirmed removal results

## Review

### CW-12 · Weekly workflow review
Project: Board setup
Evidence: Suggested operating routine for this board, not an existing automation.
Next action: Choose up to three priorities, unblock waiting work, and move verified results to Done.
Source: suggested board routine
- [ ] Choose three priorities
- [ ] Check each Waiting card for a concrete unblock action
- [ ] Move completed work to Done with evidence
- [ ] Archive stale work after review

## Done

### CW-13 · Refresh and rebuild fixed-layout web versions
Project: Kilterr
Evidence: October 10 chat reports both local builds passed, stale selection instructions removed, 314 application tests and 14 mapping tests passed, committed as 11288f6.
Next action: Retain this as completed evidence; physical checks are separate.
Source: [Open Codex chat](codex://threads/01a11096-996b-7c21-836f-b5326510af9b)

### CW-14 · Finish project-led one-page ATS resume
Project: Resume
Evidence: The resume chat reports a completed one-page A4 PDF, editable source, 34 ATS terms, working links, and colour/greyscale validation.
Next action: Use the current resume as the baseline for applications.
Source: [Open Codex chat](codex://threads/019f8e7d-aa67-7a42-ae2f-6e88118b9fdb)

### CW-15 · Repair and package direct ATS discovery
Project: Career OS
Evidence: The chat reports the discovery repair committed, release app built, 165 TypeScript and 7 Rust tests passed. Human installed-app acceptance remains separate.
Next action: Retain as implementation evidence; complete the separate acceptance card.
Source: [Open Codex chat](codex://threads/019fa3b5-e5c4-7df1-9a5e-829b6f04e44d)

### CW-16 · Complete concert ticket resale
Project: Personal admin
Evidence: Latest chat confirms both tickets sold, workflow wrapped up, and scheduled checks stopped.
Next action: No resale action remains.
Source: [Open Codex chat](codex://threads/01a11fbd-f7a8-7590-830d-aa270853e965)

