import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier, getUserIdentifier, countryCodes } from '@selfxyz/core';

export async function POST(request: NextRequest) {
  try {
    const { proof, publicSignals } = await request.json();

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { message: 'Proof and publicSignals are required' },
        { status: 400 }
      );
    }

    // Extract user ID from the proof
    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId:", userId);

    // Initialize and configure the verifier
    const selfBackendVerifier = new SelfBackendVerifier(
      'https://alfajores-forno.celo-testnet.org', // Use Celo Alfajores for testnet
      'celo-token-claimer' // Application scope
    );
    
    // Configure verification options
    selfBackendVerifier.setMinimumAge(18);
    selfBackendVerifier.excludeCountries(
      countryCodes.IRN,   // Iran
      countryCodes.PRK    // North Korea
    );
    selfBackendVerifier.enableNameAndDobOfacCheck();

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);
    
    if (result.isValid) {
      // Return successful verification response
      return NextResponse.json({
        status: 'success',
        result: true,
        credentialSubject: result.credentialSubject
      });
    } else {
      // Return failed verification response
      return NextResponse.json({
        status: 'error',
        result: false,
        message: 'Verification failed',
        details: result.isValidDetails
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying proof:', error);
    return NextResponse.json({
      status: 'error',
      result: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 