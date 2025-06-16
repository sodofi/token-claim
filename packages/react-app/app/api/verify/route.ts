import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier, getUserIdentifier } from '@selfxyz/core';

// In-memory storage for verified users (replace with database in production)
const verifiedUsers = new Map<string, {
  userId: string;
  nullifier: string;
  verifiedAt: Date;
  credentialSubject: any;
}>();

export async function POST(request: NextRequest) {
  try {
    const { proof, publicSignals } = await request.json();

    console.log('Received verification request:', { 
      hasProof: !!proof, 
      hasPublicSignals: !!publicSignals 
    });

    if (!proof || !publicSignals) {
      console.error('Missing proof or publicSignals');
      return NextResponse.json(
        { 
          status: 'error',
          result: false,
          message: 'Proof and publicSignals are required' 
        },
        { status: 400 }
      );
    }

    // Extract user ID from the proof
    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId:", userId);

    // Initialize and configure the verifier
    // Following Self Protocol documentation pattern
    const selfBackendVerifier = new SelfBackendVerifier(
      'https://forno.celo.org',
      'my-app-scope'
    );
    
    // Configure verification options to match frontend
    selfBackendVerifier.setMinimumAge(18);
    selfBackendVerifier.excludeCountries(
      "IRN",   // Iran - 3-letter ISO code
      "PRK"    // North Korea - 3-letter ISO code
    );
    selfBackendVerifier.enableNameAndDobOfacCheck();

    console.log('Starting proof verification...');

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);
    
    console.log('Verification result:', {
      isValid: result.isValid,
      userId: result.userId,
      details: result.isValidDetails
    });

    // Only check if the cryptographic proof is valid, ignore other checks
    if (result.isValidDetails.isValidProof) {
      // Store verification result
      verifiedUsers.set(userId, {
        userId: result.userId,
        nullifier: result.nullifier,
        verifiedAt: new Date(),
        credentialSubject: result.credentialSubject
      });

      console.log('Verification successful for user (proof valid):', userId);

      // Return successful verification response
      return NextResponse.json({
        status: 'success',
        result: true,
        userId: result.userId,
        nullifier: result.nullifier,
        credentialSubject: result.credentialSubject
      });
    } else {
      console.error('Cryptographic proof verification failed:', result.isValidDetails);
      
      // Return failed verification response
      return NextResponse.json({
        status: 'error',
        result: false,
        message: 'Cryptographic proof verification failed',
        details: result.isValidDetails
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying proof:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json({
      status: 'error',
      result: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 