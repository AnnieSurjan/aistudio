
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export enum TransactionType {
  INVOICE = 'Invoice',
  BILL = 'Bill',
  PAYMENT = 'Payment',
  JOURNAL = 'JournalEntry',
  PURCHASE = 'Purchase',
}

export interface Transaction {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  amount: number;
  currency: string;
  type: TransactionType;
  entityName: string; // Customer or Vendor
  account: string; // New field for Account filtering
  memo?: string;
  status: 'pending' | 'reviewed' | 'deleted';
}

export interface DuplicateGroup {
  id: string;
  reason: string;
  transactions: Transaction[];
  confidenceScore: number;
}

export interface ScanResult {
  id: string;
  date: string;
  duplicatesFound: number;
  status: 'Completed' | 'Failed' | 'Running';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  companyName: string;
  isQuickBooksConnected?: boolean;
  isXeroConnected?: boolean;
  xeroOrgName?: string;
  paddleCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'trialing' | 'paused' | 'past_due' | 'canceled';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  time: string;
}

export interface AuditLogEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export interface ExclusionRule {
  id: string;
  name: string;
  type: 'amount_below' | 'vendor_contains' | 'description_contains';
  value: string | number;
  isActive: boolean;
}