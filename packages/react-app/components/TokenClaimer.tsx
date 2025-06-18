'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Avatar, Connect, Name, Wallet } from '@composer-kit/ui/wallet';
import { Transaction, TransactionButton, TransactionStatus } from '@composer-kit/ui/transaction';
import { Address } from '@composer-kit/ui/address';
import type { Abi } from 'viem';
import SelfVerification from './SelfVerification';

// Import the ABI (this will be generated after contract compilation)
import ClaimTokenABI from '../abis/ClaimToken.json';

// Alfajores testnet chain ID
const ALFAJORES_CHAIN_ID = 44787;

// Deployed contract address on Alfajores
const CONTRACT_ADDRESS = '0xA198F6F2056f545669fa6Ee6e7BC11a7270B98b7';

interface TokenClaimerProps {
  contractAddress?: string;
}

export default function TokenClaimer({ contractAddress = CONTRACT_ADDRESS }: TokenClaimerProps) {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [claimAmount, setClaimAmount] = useState('10');
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
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

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleClaim = async () => {
    if (!address || !contractAddress || contractAddress === CONTRACT_ADDRESS) return;

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ClaimTokenABI as Abi,
        functionName: 'claimTokens',
      });
    } catch (err) {
      console.error('Error claiming tokens:', err);
    }
  };

  const handleVerificationSuccess = () => {
    setIsHumanVerified(true);
    setVerificationError(null);
  };

  const handleVerificationError = (error: string) => {
    setVerificationError(error);
  };

  useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
      refetchHasClaimed();
    }
  }, [isConfirmed, refetchBalance, refetchHasClaimed]);

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
                </div>
                {/* Human verification status indicator */}
                {isHumanVerified && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                )}
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

          {/* Claim Amount Input */}
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

          {/* Verification Error Display */}
          {verificationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {verificationError}
              </p>
            </div>
          )}

          {/* Claim Button / Verification Flow */}
          <div className="space-y-4">
            {hasClaimed ? (
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  ✅ You have already claimed your tokens!
                </p>
              </div>
            ) : !isHumanVerified ? (
              /* Show Self Protocol verification if not verified */
              <SelfVerification
                onVerificationSuccess={handleVerificationSuccess}
                onVerificationError={handleVerificationError}
              />
            ) : (
              /* Show claim button if verified */
              <Transaction
                chainId={ALFAJORES_CHAIN_ID}
                transaction={{
                  abi: ClaimTokenABI as Abi,
                  address: contractAddress as `0x${string}`,
                  functionName: 'claimTokens',
                  args: [],
                }}
                onSuccess={(result: any) => {
                  console.log('Claim successful:', result);
                  refetchBalance();
                  refetchHasClaimed();
                }}
                onError={(error: any) => {
                  console.error('Claim failed:', error);
                }}
              >
                <TransactionButton className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  Claim {formatClaimAmount(contractClaimAmount as bigint)} Tokens
                </TransactionButton>
                <TransactionStatus />
              </Transaction>
            )}
          </div>

          {/* Transaction Status */}
          {hash && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Transaction Hash:
              </p>
              <Address 
                address={hash} 
                isTruncated 
                copyOnClick 
                className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 