import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Simulate verification success for testing
    const mockVerificationResult = {
      status: 'success',
      result: true,
      userId: `user_${Date.now()}`,
      nullifier: `nullifier_${Date.now()}`,
      credentialSubject: {
        attestation_id: '1',
        current_date: new Date().toISOString().split('T')[0],
        older_than: 'true'
      }
    };

    // Save to verification status
    await fetch(`${request.nextUrl.origin}/api/verification-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: mockVerificationResult.userId,
        nullifier: mockVerificationResult.nullifier,
        walletAddress: walletAddress.toLowerCase(),
      }),
    });

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