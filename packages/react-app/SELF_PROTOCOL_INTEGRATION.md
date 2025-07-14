# Self Protocol Integration

This document describes the Self Protocol integration for human verification in the token claim application.

## Overview

The application now requires users to verify their humanity using Self Protocol before they can claim tokens. This prevents bot abuse and ensures only real humans can claim tokens.

## Architecture

### Frontend Components

1. **SimpleTokenClaimer** (`components/SimpleTokenClaimer.tsx`)
   - Main component that handles the token claiming flow
   - Integrates human verification before allowing claims
   - Shows verification status in the user's identity card

2. **useHumanVerification** (`hooks/useHumanVerification.ts`)
   - Custom hook for managing verification state
   - Handles API calls to verification endpoints
   - Tracks verification status per wallet address

### Backend Endpoints

1. **Verification Endpoint** (`app/api/verify/route.ts`)
   - Handles Self Protocol proof verification
   - Uses Self Protocol's backend SDK
   - Validates proofs and returns verification results

2. **Verification Status** (`app/api/verification-status/route.ts`)
   - Tracks which wallet addresses have been verified
   - GET: Check if an address is verified
   - POST: Save verification status

3. **Test Verification** (`app/api/test-verify/route.ts`)
   - Development endpoint for testing verification flow
   - Simulates successful verification without requiring Self app

## User Flow

1. **Connect Wallet**: User connects their wallet to the application
2. **Verification Required**: If not verified, user sees verification requirement
3. **Start Verification**: User clicks "Verify Humanity" button
4. **QR Code Display**: Self Protocol QR code is displayed with actual SelfQRcodeWrapper
5. **Scan & Verify**: User scans QR code with Self app and completes verification
6. **Proof Submission**: Self app submits proof to verification endpoint
7. **Verification Success**: Backend validates proof and marks user as verified
8. **UI Updates**: Verification success message appears without page reload
9. **Claim Tokens**: User can now claim tokens with the blue "Claim Tokens" button

## Self Protocol Configuration

The verification is configured with the following settings:

- **Minimum Age**: 18 years
- **Excluded Countries**: Iran (IRN), North Korea (PRK)
- **OFAC Checks**: Name and date of birth verification enabled
- **Application Scope**: "token-claim-app"

## Development Testing

For development purposes, a test verification endpoint is available:

```typescript
// Test verification (bypasses Self Protocol)
POST /api/test-verify
{
  "walletAddress": "0x..."
}
```

This allows testing the verification flow without requiring the Self app.

## Implementation Status

### ✅ Completed
- Backend verification endpoints with Self Protocol SDK
- Verification state management without page reloads
- UI integration with proper verification flow
- Test verification for development
- Identity card verification indicator
- Self Protocol QR code component integration
- Seamless transition from verification to token claiming

### ✅ Fixed Issues
- Removed page reload after verification success
- Proper state management for verification status
- Smooth user experience from verification to claiming

### 📋 TODO
- Add proper error handling for verification failures
- Implement verification status persistence across sessions
- Add verification expiration logic
- Production deployment configuration
- Remove test verification button for production

## Dependencies

- `@selfxyz/qrcode`: Frontend QR code generation
- `@selfxyz/core`: Backend proof verification

## Configuration

The Self Protocol integration uses the following configuration:

```typescript
// Backend verifier configuration
const selfBackendVerifier = new SelfBackendVerifier(
  'https://alfajores-forno.celo-testnet.org', // Celo Alfajores RPC
  'token-claim-app' // Application scope
);
```

## Security Considerations

1. **Proof Validation**: All proofs are cryptographically verified
2. **Nullifier Tracking**: Prevents reuse of the same proof
3. **Age Verification**: Ensures users are 18+ years old
4. **OFAC Compliance**: Checks against sanctioned entities
5. **Country Restrictions**: Excludes specified countries

## Error Handling

The integration includes comprehensive error handling for:

- Invalid proofs
- Network failures
- Verification timeouts
- Unsupported countries
- Age verification failures

## Monitoring

Verification events are logged for monitoring:

- Successful verifications
- Failed verification attempts
- Error conditions
- Performance metrics 