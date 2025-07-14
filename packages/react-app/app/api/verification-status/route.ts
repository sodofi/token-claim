import { NextRequest, NextResponse } from 'next/server';
import { verifiedUsers, addressToUserMapping, testVerifiedAddresses } from '../../../lib/verification-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { 
          status: 'error',
          result: false,
          message: 'Address parameter is required' 
        },
        { status: 400 }
      );
    }

    console.log('Checking verification status for address:', address);

    let isVerified = false;
    let verificationData = null;

    // Check if this address has been mapped to a verified user
    const mappedUserId = addressToUserMapping.get(address.toLowerCase());
    if (mappedUserId && verifiedUsers.has(mappedUserId)) {
      isVerified = true;
      verificationData = verifiedUsers.get(mappedUserId);
      console.log('Found verified user for address:', { address, userId: mappedUserId });
    }

    // Also check test verification storage for development
    if (testVerifiedAddresses.has(address.toLowerCase())) {
      isVerified = true;
      console.log('Found test verification for address:', address);
    }

    console.log('Verification status result:', { address, isVerified });

    return NextResponse.json({
      status: 'success',
      result: true,
      isVerified,
      address,
      verificationData: verificationData ? {
        verifiedAt: verificationData.verifiedAt,
        userId: verificationData.userId.substring(0, 8) + '...' // Truncated for privacy
      } : null
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json({
      status: 'error',
      result: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, nullifier, walletAddress } = await request.json();

    if (!userId || !nullifier || !walletAddress) {
      return NextResponse.json(
        { message: 'userId, nullifier, and walletAddress are required' },
        { status: 400 }
      );
    }

    console.log('Saving verification status:', { userId, walletAddress });

    // Store the verification with wallet address
    verifiedUsers.set(userId, {
      userId,
      nullifier,
      verifiedAt: new Date(),
      credentialSubject: {},
      walletAddress
    });

    // Create the address mapping
    addressToUserMapping.set(walletAddress.toLowerCase(), userId);

    console.log('Verification status saved successfully');

    return NextResponse.json({
      status: 'success',
      message: 'Verification status saved'
    });
  } catch (error) {
    console.error('Error saving verification status:', error);
    return NextResponse.json({
      message: 'Internal server error'
    }, { status: 500 });
  }
} 