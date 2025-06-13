'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import TokenClaimer from '../components/TokenClaimer';

export default function Home() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
    }
  }, [address, isConnected]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Celo Token Claimer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connect your wallet and claim your free tokens on the Celo Alfajores testnet
          </p>
        </div>
        
        <TokenClaimer />
        
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Connect Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Connect your wallet to the Celo Alfajores testnet
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Check Eligibility
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Each wallet can claim tokens only once
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Claim Tokens
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Click claim to receive your free tokens
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
