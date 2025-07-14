// Shared storage for verification data (replace with database in production)
export const verifiedUsers = new Map<string, {
  userId: string;
  nullifier: string;
  verifiedAt: Date;
  credentialSubject: any;
  walletAddress?: string;
}>();

// Mapping from wallet address to userId for quick lookups
export const addressToUserMapping = new Map<string, string>();

// Test verified addresses for development
export const testVerifiedAddresses = new Set<string>(); 