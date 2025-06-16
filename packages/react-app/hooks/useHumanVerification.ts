import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface VerificationResult {
  status: string;
  result: boolean;
  userId?: string;
  nullifier?: string;
  credentialSubject?: any;
  message?: string;
  details?: any;
}

interface VerificationStatus {
  isVerified: boolean;
  address: string;
}

export function useHumanVerification() {
  const { address } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationResult | null>(null);

  // Check verification status when address changes
  useEffect(() => {
    if (address) {
      checkVerificationStatus(address);
    } else {
      setIsVerified(false);
      setVerificationData(null);
    }
  }, [address]);

  const checkVerificationStatus = useCallback(async (walletAddress: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/verification-status?address=${walletAddress}`);
      const data: VerificationStatus = await response.json();
      setIsVerified(data.isVerified);
    } catch (err) {
      console.error('Error checking verification status:', err);
      setError('Failed to check verification status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyProof = useCallback(async (proof: any, publicSignals: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify the proof
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proof, publicSignals }),
      });

      const verificationResult: VerificationResult = await verifyResponse.json();

      if (verificationResult.result && address) {
        // Save verification status
        await fetch('/api/verification-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: verificationResult.userId,
            nullifier: verificationResult.nullifier,
            walletAddress: address,
          }),
        });

        setIsVerified(true);
        setVerificationData(verificationResult);
      } else {
        setError(verificationResult.message || 'Verification failed');
      }

      return verificationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const resetVerification = useCallback(() => {
    setIsVerified(false);
    setVerificationData(null);
    setError(null);
  }, []);

  return {
    isVerified,
    isLoading,
    error,
    verificationData,
    verifyProof,
    checkVerificationStatus,
    resetVerification,
  };
} 