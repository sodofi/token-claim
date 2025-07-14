import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier, getUserIdentifier } from '@selfxyz/core';
import { verifiedUsers, addressToUserMapping, testVerifiedAddresses } from '../../../lib/verification-storage';

export async function POST(request: NextRequest) {
  try {
    const { proof, publicSignals } = await request.json();
    
    // Extract wallet address from query parameter
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress') || undefined;

    console.log('Received verification request:', { 
      hasProof: !!proof, 
      hasPublicSignals: !!publicSignals,
      walletAddress 
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
    const selfBackendVerifier = new SelfBackendVerifier(
      'https://forno.celo.org',
      'token-claim-app' // Use consistent scope
    );
    
    // Configure verification options to match frontend
    selfBackendVerifier.setMinimumAge(18);
    selfBackendVerifier.excludeCountries(
      "IRN",   // Iran
      "PRK"    // North Korea
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

    if (result.isValid && result.isValidDetails.isValidProof) {
      // Store verification result with wallet address linkage
      verifiedUsers.set(userId, {
        userId: result.userId,
        nullifier: result.nullifier,
        verifiedAt: new Date(),
        credentialSubject: result.credentialSubject,
        walletAddress: walletAddress // Link to wallet address from query param
      });

      // If wallet address is provided, create the mapping
      if (walletAddress) {
        addressToUserMapping.set(walletAddress.toLowerCase(), userId);
        console.log('Linked wallet address to userId:', { walletAddress, userId });
      }

      console.log('Verification successful for user:', userId);

      // Return successful verification response
      return NextResponse.json({
        status: 'success',
        result: true,
        userId: result.userId,
        nullifier: result.nullifier,
        credentialSubject: result.credentialSubject
      });
    } else {
      console.error('Verification failed:', result.isValidDetails);
      
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