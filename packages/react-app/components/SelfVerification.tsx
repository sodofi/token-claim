'use client';

import { useState, useEffect } from 'react';
import { useSelfVerification } from '../hooks/useSelfVerification';
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';
import { useAccount } from 'wagmi';

interface SelfVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationError?: (error: string) => void;
}

export default function SelfVerification({ 
  onVerificationSuccess, 
  onVerificationError 
}: SelfVerificationProps) {
  const { address } = useAccount();
  const { 
    verificationState, 
    initiateVerification, 
    handleVerificationComplete,
    resetVerification 
  } = useSelfVerification();
  
  const [showQR, setShowQR] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate a user ID when the component mounts
    setUserId(uuidv4());
  }, []);

  const handleStartVerification = async () => {
    const verificationId = await initiateVerification();
    if (verificationId) {
      setShowQR(true);
    } else if (onVerificationError) {
      onVerificationError(verificationState.error || 'Failed to start verification');
    }
  };

  const handleClose = () => {
    setShowQR(false);
    resetVerification();
  };

  const handleSelfVerificationSuccess = () => {
    setShowQR(false);
    onVerificationSuccess();
  };

  // Mock verification for testing - remove in production
  const handleMockVerification = async () => {
    // Mock proof data for testing
    const mockProof = { proof: "mock_proof_data" };
    const mockPublicSignals = { signals: "mock_signals" };
    
    const success = await handleVerificationComplete(mockProof, mockPublicSignals);
    if (success) {
      setShowQR(false);
      onVerificationSuccess();
    } else if (onVerificationError) {
      onVerificationError(verificationState.error || 'Verification failed');
    }
  };

  // Show verification success state
  if (verificationState.isVerified) {
    return (
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-800 dark:text-green-200 font-medium">
            ✅ Humanity Verified!
          </span>
        </div>
        <p className="text-sm text-green-600 dark:text-green-400">
          You can now claim your tokens
        </p>
      </div>
    );
  }

  // Show QR code modal
  if (showQR && userId) {
    // Create the SelfApp configuration
    const selfApp = new SelfAppBuilder({
      appName: "Celo Token Claimer",
      scope: "celo-token-claimer",
      endpoint: `${window.location.origin}/api/self/verify`,
      userId,
      disclosures: {
        // Request basic passport information for humanity verification
        name: false, // We don't need personal info, just proof of humanity
        nationality: false,
        date_of_birth: false,
        
        // Set verification rules
        minimumAge: 18,
        excludedCountries: ["IRN", "PRK"], // Iran, North Korea as per docs
        ofac: true, // Enable OFAC sanctions check
      },
    }).build();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verify Your Humanity
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Scan this QR code with the Self app to verify your humanity
            </p>
            
            <div className="flex justify-center mb-4">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSelfVerificationSuccess}
                size={300}
              />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              User ID: {userId.substring(0, 8)}...
            </p>
            
            {/* Mock verification button for testing - remove in production */}
            <button
              onClick={handleMockVerification}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg mb-4"
            >
              Mock Verify (For Testing)
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Don't have the Self app? Download it from your app store
            </p>
          </div>
          
          {verificationState.error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {verificationState.error}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show verification button
  return (
    <button
      onClick={handleStartVerification}
      disabled={verificationState.isVerifying}
      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
    >
      {verificationState.isVerifying ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Preparing Verification...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Verify Humanity to Claim 10 Tokens
        </>
      )}
    </button>
  );
} 