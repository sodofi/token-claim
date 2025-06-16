import { NextRequest, NextResponse } from 'next/server';

// Import the verifiedUsers map from the verify endpoint
// In production, this would be a database query
const verifiedUsers = new Map<string, {
  userId: string;
  nullifier: string;
  verifiedAt: Date;
  credentialSubject: any;
}>();

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

    // In a real implementation, you would:
    // 1. Query your database for verification records linked to this wallet address
    // 2. Check if the user has completed Self Protocol verification
    // For now, we'll check our in-memory storage and also provide a way to link wallet addresses

    // Check if any verified user is associated with this wallet address
    // This is a simplified approach - in production you'd have a proper user mapping
    let isVerified = false;
    let verificationData = null;

    // For development, we'll also check a simple mapping
    // In production, you'd store wallet address -> userId mapping in your database
    const addressToUserMapping = new Map<string, string>();
    
    // Check if this address has been mapped to a verified user
    const mappedUserId = addressToUserMapping.get(address.toLowerCase());
    if (mappedUserId && verifiedUsers.has(mappedUserId)) {
      isVerified = true;
      verificationData = verifiedUsers.get(mappedUserId);
    }

    // Also check our test verification storage
    const testVerifiedAddresses = new Set<string>();
    if (testVerifiedAddresses.has(address.toLowerCase())) {
      isVerified = true;
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

    // Store the verification
    verifiedUsers.set(userId, {
      userId,
      nullifier,
      verifiedAt: new Date(),
      credentialSubject: {
        // Populate this with actual credential subject data
      }
    });

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