# Firestore Security Specification (`formation HandManager Pro5`)

## 1. Roles & Relationship Mapping
- **Central Manager (`isCentralManager`)**: Authenticated user whose verified token email (`request.auth.token.email_verified == true`) matches one of the designated manager accounts (`printomrdesigne@gmail.com`, `mohamani.figuig@gmail.com`, `omrhaman.figuig@gmail.com`). Has full administrative control over `/users/{userId}` and `/app_config/subscriber_features`.
- **Subscriber (`request.auth.uid == userId`)**: Authenticated user who owns `/users/{userId}` and `/users/{userId}/matches/{matchId}`. Can read their own profile and `/app_config/subscriber_features`, update non-privileged profile metadata, or activate their own account strictly with the `activationCode` pre-assigned by the Central Manager.
- **Unauthenticated / Third-Party User**: Denied all reads and writes across all collections.

## 2. Data Invariants
1. Self-registration under `/users/{userId}` MUST initialize `isActive == false`, `isPro == false`, `isBlocked == false`, and MUST NOT include `enabledFeatures` or `managerNotes`.
2. A subscriber cannot escalate their own `isActive`, `isPro`, `isBlocked`, or `enabledFeatures` fields via self-update unless redeeming a valid `activationCode` pre-written by the Central Manager while `isBlocked != true`.
3. Only a verified Central Manager can list `/users`, modify `enabledFeatures`, renew/block/close accounts, or write `/app_config/subscriber_features`.
4. All document IDs (`userId`, `matchId`) must match `^[a-zA-Z0-9_\-]+$` (`size <= 128`), and every string field enforces explicit max length bounds.
5. `users/{userId}/matches/{matchId}` requires an existing parent `/users/{userId}` document and enforces `userId == request.auth.uid` on both writes and `allow list` queries.

## 3. Dirty Dozen Adversarial Payloads (All Must Return `PERMISSION_DENIED`)
1. **Self-Activation on Sign-Up**: New user creates `/users/user_1` with `{ uid: "user_1", email: "a@b.com", displayName: "A", isActive: true, isPro: true }`.
2. **Self-Enable Features on Update**: Existing subscriber updates `/users/user_1` adding `enabledFeatures: { aiAnalysis: true, socialPoster: true }`.
3. **Unverified Admin Email Spoof**: User with `email: "printomrdesigne@gmail.com"` and `email_verified: false` writes `/app_config/subscriber_features`.
4. **Subscriber Global Config Tampering**: Verified non-manager subscriber attempts `setDoc` on `/app_config/subscriber_features`.
5. **Cross-Tenant PII Read**: Subscriber `user_1` reads `get(/users/user_2)` containing email/phone/activationCode.
6. **Unauthorized Directory Listing**: Non-manager subscriber calls `list(/users)` to scrape all subscriber profiles.
7. **Bypass Activation Code Redemption**: Subscriber updates `isActive: true, licenseKey: "HBM-FREE"` when `existing().activationCode` is empty or `"HBM-9911"`.
8. **Blocked Account Self-Reactivation**: Blocked user (`isBlocked: true`) attempts `activateUserWithCode` even with an old `activationCode`.
9. **Shadow Field Injection**: Subscriber updates `/users/user_1` with an unknown ghost key `{ displayName: "Valid", isSuperAdmin: true }`.
10. **ID Poisoning / Resource Exhaustion**: Write to `/users/invalid..path..150chars` or oversized `blockReason` string (> 500 chars).
11. **Orphan Match Write**: User attempts to create `/users/nonexistent_uid/matches/m1` without parent user document.
12. **Arbitrary Config Document Write**: User or manager attempts to write `/app_config/arbitrary_doc` or invalid feature key `{ features: { unknownFlag: true } }`.
