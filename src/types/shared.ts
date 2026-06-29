export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'KES' | 'GHS' | 'ZAR';
export type UserRole = 'USER' | 'BUSINESS' | 'ADMIN';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'REFUND' | 'EXCHANGE';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'CANCELLED';
export type PaymentProviderType = 'FLUTTERWAVE' | 'PAYSTACK' | 'INTERNAL';

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  kycStatus: KycStatus;
  avatarUrl: string | null;
  country: string | null;
  createdAt: string;
}

export interface WalletData {
  id: string;
  currency: CurrencyCode;
  balance: string;
  lockedBalance: string;
  isActive: boolean;
  isDefault: boolean;
  accountNumber: string | null;
  createdAt: string;
}

export interface TransactionData {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  currency: CurrencyCode;
  reference: string;
  description: string | null;
  provider: PaymentProviderType | null;
  providerRef: string | null;
  completedAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
