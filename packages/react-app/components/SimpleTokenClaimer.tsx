'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { Avatar, Connect, Name, Wallet } from '@composer-kit/ui/wallet';
import { Address } from '@composer-kit/ui/address';
import { useHumanVerification } from '../hooks/useHumanVerification';
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';
import type { Abi } from 'viem';

// Import the ABI
import ClaimTokenABI from '../abis/ClaimToken.json';

// Deployed contract address on Alfajores
const CONTRACT_ADDRESS = '0xA198F6F2056f545669fa6Ee6e7BC11a7270B98b7';

interface SimpleTokenClaimerProps {
  contractAddress?: string;
}

export default function SimpleTokenClaimer({ contractAddress = CONTRACT_ADDRESS }: SimpleTokenClaimerProps) {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { isVerified, isLoading: verificationLoading, verifyProof, checkVerificationStatus } = useHumanVerification();

  useEffect(() => {
    setIsMounted(true);
    // Generate a user ID when the component mounts
    setUserId(uuidv4());
  }, []);

  // Read user's token balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ClaimTokenABI as Abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  // Check if user has already claimed
  const { data: hasClaimed, refetch: refetchHasClaimed } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ClaimTokenABI as Abi,
    functionName: 'hasAddressClaimed',
    args: [address],
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  // Get claim amount from contract
  const { data: contractClaimAmount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ClaimTokenABI as Abi,
    functionName: 'getClaimAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  const handleStartVerification = () => {
    setShowVerification(true);
    setVerificationError(null);
  };

  const handleTestVerification = async () => {
    if (!address) return;
    
    try {
      setVerificationError(null);
      const response = await fetch('/api/test-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const result = await response.json();
      if (result.result) {
        // Refresh verification status instead of reloading
        await checkVerificationStatus(address);
        setShowVerification(false);
      } else {
        setVerificationError(result.message || 'Test verification failed');
      }
    } catch (error) {
      setVerificationError('Test verification failed');
    }
  };

  const handleSelfVerificationSuccess = async () => {
    console.log("Self Protocol verification successful!");
    setShowVerification(false);
    setVerificationError(null);
    
    // Refresh verification status to update the UI
    if (address) {
      await checkVerificationStatus(address);
    }
  };

  const handleClaim = async () => {
    if (!address || !contractAddress || !isVerified) return;

    setIsClaimLoading(true);
    try {
      // This would normally use wagmi's writeContract
      // For now, just show success message
      alert('Claim functionality would be triggered here');
      refetchBalance();
      refetchHasClaimed();
    } catch (err) {
      console.error('Error claiming tokens:', err);
    } finally {
      setIsClaimLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return '0';
    return parseFloat(formatEther(bal)).toFixed(2);
  };

  const formatClaimAmount = (amount: bigint | undefined) => {
    if (!amount) return '10';
    return parseFloat(formatEther(amount)).toString();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Token Claimer
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Verify your humanity and claim your free tokens
        </p>
      </div>

      {/* Wallet Connection */}
      <div className="flex justify-center">
        <Wallet>
          <Connect
            label={isConnected ? undefined : "Connect Wallet"}
            onConnect={() => {
              console.log("Wallet connected");
            }}
          >
            {isConnected && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Avatar />
                <div className="flex-1">
                  <Name isTruncated />
                  <Address 
                    address={address || ''} 
                    isTruncated 
                    copyOnClick 
                    className="text-sm text-gray-500 dark:text-gray-400"
                  />
                  {isVerified && (
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Human Verified</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Connect>
        </Wallet>
      </div>

      {isConnected && (
        <>
          {/* Token Balance Display */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Your Token Balance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBalance(balance as bigint)} CLAIM
              </p>
            </div>
          </div>

          {/* Claim Amount Display */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Claim Amount
            </label>
            <input
              type="text"
              value={formatClaimAmount(contractClaimAmount as bigint)}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fixed amount per claim
            </p>
          </div>

          {/* Human Verification Section */}
          {!isVerified && !hasClaimed && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-purple-800 dark:text-purple-200 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Human Verification Required</span>
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  Prove you're human to claim tokens and prevent bot abuse
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleStartVerification}
                  disabled={verificationLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {verificationLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Checking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Verify Humanity to Claim {formatClaimAmount(contractClaimAmount as bigint)} Tokens</span>
                    </div>
                  )}
                </button>

                {/* Test Verification Button for Development */}
                <button
                  onClick={handleTestVerification}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  🧪 Test Verification (Dev Only)
                </button>
              </div>

              {verificationError && (
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    {verificationError}
                  </p>
                </div>
              )}

              {showVerification && userId && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Verify Your Humanity
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Scan this QR code with the Self app to verify your identity
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <SelfQRcodeWrapper
                      selfApp={new SelfAppBuilder({
                        appName: "Token Claim App",
                        scope: "token-claim-app",
                        endpoint: `${window.location.origin}/api/verify?walletAddress=${encodeURIComponent(address || '')}`,
                        userId,
                        disclosures: {
                          // Request passport information for humanity verification
                          name: true,
                          nationality: true,
                          date_of_birth: true,
                          
                          // Set verification rules
                          minimumAge: 18,
                          excludedCountries: ["IRN", "PRK"],
                          ofac: true,
                        },
                      }).build()}
                      onSuccess={handleSelfVerificationSuccess}
                      size={300}
                    />
                  </div>
                  
                  <div className="text-center mt-4 space-y-2">
                    <button
                      onClick={() => setShowVerification(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p>Don't have the Self app? <a href="https://self.xyz" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">Download here</a></p>
                      <p className="mt-1">User ID: {userId.substring(0, 8)}...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verification Success Message */}
          {isVerified && !hasClaimed && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-green-800 dark:text-green-200 mb-2">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">✅ Humanity Verified!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                You can now claim your tokens below
              </p>
            </div>
          )}

          {/* Claim Button - Only show if verified */}
          {isVerified && !hasClaimed && (
            <div className="space-y-4">
              <button
                onClick={handleClaim}
                disabled={isClaimLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isClaimLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Claiming...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Claim {formatClaimAmount(contractClaimAmount as bigint)} Tokens</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Already Claimed Message */}
          {hasClaimed && (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                ✅ You have already claimed your tokens!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 