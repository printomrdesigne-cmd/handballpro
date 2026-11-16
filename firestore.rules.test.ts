/**
 * Dirty Dozen Security Rule Verification Specification & Test Matrix
 * Maps each adversarial payload from security_spec.md to the enforcing gate in firestore.rules.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actor: 'anonymous' | 'subscriber' | 'blocked_subscriber' | 'unverified_manager_email' | 'central_manager';
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
  enforcingGate: string;
}

export const SECURITY_TEST_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Self-Activation on Sign-Up',
    operation: 'create',
    path: '/users/user_1',
    actor: 'subscriber',
    payload: { uid: 'user_1', email: 'a@b.com', displayName: 'A', isActive: true, isPro: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().isActive == false && (!("isPro" in incoming()) || incoming().isPro == false)'
  },
  {
    id: 2,
    name: 'Self-Enable Features on Update',
    operation: 'update',
    path: '/users/user_1',
    actor: 'subscriber',
    payload: { enabledFeatures: { aiAnalysis: true, socialPoster: true } },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().diff(existing()).affectedKeys().hasOnly(["displayName","phone","clubName","updatedAt"])'
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof',
    operation: 'update',
    path: '/app_config/subscriber_features',
    actor: 'unverified_manager_email',
    payload: { features: { newMatch: true }, updatedAt: '2026-01-01T00:00:00.000Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'request.auth.token.email_verified == true in isCentralManager()'
  },
  {
    id: 4,
    name: 'Subscriber Global Config Tampering',
    operation: 'create',
    path: '/app_config/subscriber_features',
    actor: 'subscriber',
    payload: { features: { newMatch: false }, updatedAt: '2026-01-01T00:00:00.000Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isCentralManager() on /app_config/{configId}'
  },
  {
    id: 5,
    name: 'Cross-Tenant PII Read',
    operation: 'get',
    path: '/users/user_2',
    actor: 'subscriber',
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'request.auth.uid == userId || isCentralManager()'
  },
  {
    id: 6,
    name: 'Unauthorized Directory Listing',
    operation: 'list',
    path: '/users',
    actor: 'subscriber',
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'allow list: if isCentralManager()'
  },
  {
    id: 7,
    name: 'Bypass Activation Code Redemption',
    operation: 'update',
    path: '/users/user_1',
    actor: 'subscriber',
    payload: { isActive: true, isPro: true, licenseKey: 'HBM-FAKE', updatedAt: '2026-01-01T00:00:00.000Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().licenseKey == existing().activationCode && existing().activationCode.size() >= 4'
  },
  {
    id: 8,
    name: 'Blocked Account Self-Reactivation',
    operation: 'update',
    path: '/users/user_1',
    actor: 'blocked_subscriber',
    payload: { isActive: true, isPro: true, licenseKey: 'HBM-9911', updatedAt: '2026-01-01T00:00:00.000Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'existing().isBlocked != true'
  },
  {
    id: 9,
    name: 'Shadow Field Injection',
    operation: 'update',
    path: '/users/user_1',
    actor: 'subscriber',
    payload: { displayName: 'Valid Name', isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isValidUser(incoming()) keys().hasOnly(...) && affectedKeys().hasOnly(...)'
  },
  {
    id: 10,
    name: 'ID Poisoning & String Exhaustion',
    operation: 'create',
    path: '/users/bad..id',
    actor: 'subscriber',
    payload: { uid: 'bad..id', email: 'a@b.com', displayName: 'A', isActive: false },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isValidId(userId) regex ^[a-zA-Z0-9_\\-]+$'
  },
  {
    id: 11,
    name: 'Orphan Match Creation',
    operation: 'create',
    path: '/users/missing_user/matches/m1',
    actor: 'subscriber',
    payload: { userId: 'missing_user', id: 'm1' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'exists(/databases/$(database)/documents/users/$(userId))'
  },
  {
    id: 12,
    name: 'Unknown Feature Key Injection',
    operation: 'update',
    path: '/app_config/subscriber_features',
    actor: 'central_manager',
    payload: { features: { unknownFlag: true }, updatedAt: '2026-01-01T00:00:00.000Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isValidFeatureMap(data.features) keys().hasOnly(VALID_FEATURE_KEYS)'
  }
];
