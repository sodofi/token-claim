# Self Protocol Integration

This document describes the Self Protocol integration for human verification in the Celo Token Claimer application.

## Overview

The application now requires users to verify their humanity using Self Protocol before they can claim tokens. This prevents bots and ensures fair distribution using zero-knowledge proofs generated from passport data.

## Components

### 1. API Routes

#### `/api/self/initiate` (POST)
- Initiates a verification session
- Takes wallet address as input
- Returns verification ID for tracking

#### `/api/self/verify` (POST)
- Verifies Self Protocol proofs using the SelfBackendVerifier
- Takes proof and publicSignals from Self app
- Validates proofs with configured rules (minimum age 18, excludes sanctioned countries, OFAC check)
- Returns verification status and credential subject

### 2. Frontend Components

#### `SelfVerification.tsx`
- Implements the actual Self Protocol QRCodeGenerator using `SelfQRcodeWrapper`
- Configures SelfApp with proper settings for humanity verification
- Shows verification button → QR code modal → success state
- Includes mock verification for testing purposes

#### `useSelfVerification.ts`
- Custom hook for managing verification state
- Handles API calls to initiate and verify proofs
- Manages verification status and errors

### 3. Updated TokenClaimer

The `TokenClaimer` component now:
- Requires human verification before showing claim button
- Shows verification status in the identity card
- Gates token claiming behind successful verification

## Self Protocol Configuration

### Frontend (SelfApp)
```javascript
const selfApp = new SelfAppBuilder({
  appName: "Celo Token Claimer",
  scope: "celo-token-claimer",
  endpoint: `${window.location.origin}/api/self/verify`,
  userId: uuidv4(), // Unique user identifier
  disclosures: {
    name: false, // Privacy-first - only verify humanity
    nationality: false,
    date_of_birth: false,
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"], // Iran, North Korea
    ofac: true, // OFAC sanctions check
  },
}).build();
```

### Backend (SelfBackendVerifier)
```javascript
const selfBackendVerifier = new SelfBackendVerifier(
  'https://alfajores-forno.celo-testnet.org', // Celo Alfajores testnet
  'celo-token-claimer' // Application scope
);

// Configure verification rules
selfBackendVerifier.setMinimumAge(18);
selfBackendVerifier.excludeCountries(
  countryCodes.IRN,   // Iran
  countryCodes.PRK    // North Korea
);
selfBackendVerifier.enableNameAndDobOfacCheck();
```

## Flow

1. User connects wallet
2. User clicks "Verify Humanity to Claim 10 Tokens"
3. QR code modal appears with actual Self Protocol QR code
4. User scans QR with Self app
5. Self app guides user through passport verification
6. Self app generates zero-knowledge proof and sends to `/api/self/verify`
7. Backend validates proof using Self Protocol SDK with configured rules
8. Frontend updates to show verification success
9. User can now claim tokens

## Testing

The implementation includes a "Mock Verify" button for testing the flow without scanning the QR code. This allows testing the complete verification flow during development.

## Production Deployment

For production deployment:
1. ✅ Actual Self Protocol QRCodeGenerator is now implemented
2. Remove the mock verification button
3. Ensure proper error handling for network issues
4. Consider adding verification state persistence
5. Monitor verification success rates and adjust rules if needed

## Security Considerations

- Proofs are validated server-side using Self Protocol's verification SDK
- Zero-knowledge proofs ensure privacy - no personal data is stored
- Verification includes age verification (18+), country exclusions, and OFAC checks
- Each verification session has a unique user ID
- Verification is tied to wallet addresses to prevent reuse

## Dependencies

- `@selfxyz/qrcode`: Frontend QR code generation and Self app integration
- `@selfxyz/core`: Backend proof verification with SelfBackendVerifier
- `uuid`: Generate unique user identifiers for verification sessions

## Configuration

The application is configured with:
- Application scope: "celo-token-claimer"
- Network: Celo Alfajores testnet (`https://alfajores-forno.celo-testnet.org`)
- Verification endpoint: `/api/self/verify`
- Minimum age: 18 years
- Excluded countries: Iran (IRN), North Korea (PRK)
- OFAC sanctions checking: Enabled

## Privacy Features

- Only verifies humanity without storing personal information
- Zero-knowledge proofs ensure passport data never leaves the user's device
- No names, dates of birth, or nationalities are disclosed to the application
- Only proof of humanity, age verification, and sanctions compliance are verified 