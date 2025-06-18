import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Generate a unique verification session ID
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store verification session (in production, use a proper database)
    // For now, we'll just return the verification ID
    
    return NextResponse.json({
      success: true,
      verificationId,
      walletAddress,
    });
  } catch (error) {
    console.error('Error initiating verification:', error);
    return NextResponse.json(
      { error: 'Failed to initiate verification' },
      { status: 500 }
    );
  }
} 