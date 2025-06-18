import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface VerificationState {
  isVerified: boolean;
  isVerifying: boolean;
  verificationId: string | null;
  userId: string | null;
  error: string | null;
  nullifier: string | null;
}

export const useSelfVerification = () => {
  const { address } = useAccount();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isVerified: false,
    isVerifying: false,
    verificationId: null,
    userId: null,
    error: null,
    nullifier: null,
  });

  const initiateVerification = useCallback(async () => {
    if (!address) {
      setVerificationState(prev => ({
        ...prev,
        error: 'Wallet not connected'
      }));
      return null;
    }

    try {
      setVerificationState(prev => ({
        ...prev,
        isVerifying: true,
        error: null
      }));

      const response = await fetch('/api/self/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationState(prev => ({
          ...prev,
          verificationId: data.verificationId
        }));
        return data.verificationId;
      } else {
        throw new Error(data.error || 'Failed to initiate verification');
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        isVerifying: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return null;
    }
  }, [address]);

  const handleVerificationComplete = useCallback(async (proof: any, publicSignals: any) => {
    if (!verificationState.verificationId) {
      setVerificationState(prev => ({
        ...prev,
        error: 'No verification session found'
      }));
      return false;
    }

    try {
      const response = await fetch('/api/self/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          publicSignals,
          verificationId: verificationState.verificationId,
        }),
      });

      const data = await response.json();

      if (data.result) {
        setVerificationState(prev => ({
          ...prev,
          isVerified: true,
          isVerifying: false,
          userId: data.userId,
          nullifier: data.nullifier,
          error: null
        }));
        return true;
      } else {
        setVerificationState(prev => ({
          ...prev,
          isVerifying: false,
          error: data.message || 'Verification failed'
        }));
        return false;
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        isVerifying: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [verificationState.verificationId]);

  const resetVerification = useCallback(() => {
    setVerificationState({
      isVerified: false,
      isVerifying: false,
      verificationId: null,
      userId: null,
      error: null,
      nullifier: null,
    });
  }, []);

  return {
    verificationState,
    initiateVerification,
    handleVerificationComplete,
    resetVerification,
  };
}; 