# Review Flow Handoff

## Purpose
- This document is a lightweight handoff for the review feature work.
- It is meant to let the next session resume without re-analyzing the whole thread.

## Workspace
- Active local folder:
  - `C:\hsmocap\onejun_branch`
- Active GitHub branch target:
  - `onejun`

## Current review feature goal
- Reuse the existing sentence quiz UI.
- Save quiz outcomes to Firestore.
- Build a review queue from wrong/weak/due words.
- Let users enter review sessions from the existing review flow.
- Update review stage and next review time after review attempts.

## Implemented progress
- Estimated completion:
  - about 80~85%

### Done
1. Review data structure plan created
   - `C:\hsmocap\onejun_branch\guidelines\ReviewFlowPlan.md`
2. Firestore helper added
   - `C:\hsmocap\onejun_branch\src\app\lib\wordProgresses.ts`
3. Sentence quiz results persist to Firestore progress docs
   - `C:\hsmocap\onejun_branch\src\app\pages\SentenceQuiz.tsx`
4. Review list reads real review candidates
   - `C:\hsmocap\onejun_branch\src\app\pages\ReviewList.tsx`
5. Review list starts review sessions through existing sentence quiz UI
   - session storage key: `review-queue-word-ids`
6. Review mode updates `currentStage` and `nextReviewAt`
7. Review queue cleanup added when review finishes or leaves completion flow

### Still left
1. Manual QA of the full flow
2. Confirm home review count and review list behavior with real data
3. Optional cleanup/polish if QA finds issues
4. Commit/push current review changes if desired

## Firestore structure used
- `users/{uid}/wordProgresses/{wordId}`

### Expected fields
- `wordId`
- `status`
- `currentStage`
- `totalAnswerCount`
- `correctAnswerCount`
- `lastReviewedAt`
- `nextReviewAt`
- `lastResult`
- `createdAt`
- `updatedAt`

## Files touched for review flow
- `C:\hsmocap\onejun_branch\guidelines\ReviewFlowPlan.md`
- `C:\hsmocap\onejun_branch\guidelines\ReviewFlowHandoff.md`
- `C:\hsmocap\onejun_branch\src\app\lib\wordProgresses.ts`
- `C:\hsmocap\onejun_branch\src\app\pages\SentenceQuiz.tsx`
- `C:\hsmocap\onejun_branch\src\app\pages\ReviewList.tsx`
- `C:\hsmocap\onejun_branch\src\app\pages\Home.tsx`

## Current user flow
1. User solves the normal sentence quiz.
2. Correct/wrong results are stored in `wordProgresses`.
3. Home shows a review waiting count.
4. `/app/review` shows real review candidates.
5. User starts review from the review list.
6. Existing sentence quiz opens in `mode=review`.
7. Review results update stage and next review timing.

## Important implementation details
- Review queue storage key:
  - `review-queue-word-ids`
- Review mode detection:
  - query param `mode=review`
- Review queue selection helper:
  - `listReviewQueueWordIds(uid, now?)`
- Queue is cleared when:
  - review session completes
  - completion screen leaves to home

## Recommended next step
- Run a short manual QA:
  1. Open sentence quiz
  2. Intentionally answer some items wrong
  3. Open `/app/review`
  4. Confirm those words appear
  5. Start review session
  6. Answer correctly and incorrectly
  7. Confirm progress doc values change in Firestore

## Manual QA checklist
- [ ] Wrong answer creates/updates a `wordProgresses` doc
- [ ] Home review count changes after wrong answers
- [ ] Review list shows wrong/weak/due words
- [ ] Review session starts from review list
- [ ] Review completion clears stale session queue
- [ ] `currentStage` increases on successful review
- [ ] `nextReviewAt` moves forward after successful review
- [ ] Wrong review answer moves item back to quick retry timing

## Known environment note
- `git status` from this environment may fail with a `safe.directory` warning on:
  - `C:\hsmocap\onejun_branch`
- Build itself has been working.

## Last known build status
- `npm run build` succeeded in:
  - `C:\hsmocap\onejun_branch`

