import { NextRequest, NextResponse } from 'next/server';
import { testVerifiedAddresses, addressToUserMapping, verifiedUsers } from '../../../lib/verification-storage';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('Test verification for wallet address:', walletAddress);

    // Simulate verification success for testing
    const mockUserId = `test_user_${Date.now()}`;
    const mockNullifier = `test_nullifier_${Date.now()}`;
    
    const mockVerificationResult = {
      status: 'success',
      result: true,
      userId: mockUserId,
      nullifier: mockNullifier,
      credentialSubject: {
        attestation_id: '1',
        current_date: new Date().toISOString().split('T')[0],
        older_than: 'true'
      }
    };

    // Add to test verified addresses
    testVerifiedAddresses.add(walletAddress.toLowerCase());
    
    // Also add to the main verification storage for consistency
    verifiedUsers.set(mockUserId, {
      userId: mockUserId,
      nullifier: mockNullifier,
      verifiedAt: new Date(),
      credentialSubject: mockVerificationResult.credentialSubject,
      walletAddress: walletAddress.toLowerCase()
    });

    // Create the address mapping
    addressToUserMapping.set(walletAddress.toLowerCase(), mockUserId);

    console.log('Test verification completed successfully for:', walletAddress);

    return NextResponse.json(mockVerificationResult);
  } catch (error) {
    console.error('Error in test verification:', error);
    return NextResponse.json({
      status: 'error',
      result: false,
      message: 'Test verification failed'
    }, { status: 500 });
  }
} 