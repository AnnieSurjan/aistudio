import { Transaction, TransactionType, DuplicateGroup, ScanResult } from "../types";

// Helper to generate random dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Exact Match Group (USD)
  { id: 'TXN-001', date: '2023-10-25', amount: 1500.00, currency: 'USD', type: TransactionType.INVOICE, entityName: 'Acme Corp', account: 'Accounts Receivable', status: 'pending' },
  { id: 'TXN-002', date: '2023-10-25', amount: 1500.00, currency: 'USD', type: TransactionType.INVOICE, entityName: 'Acme Corp', account: 'Accounts Receivable', status: 'pending' },
  
  // Fuzzy Amount Group (USD)
  { id: 'TXN-003', date: '2023-10-26', amount: 499.99, currency: 'USD', type: TransactionType.BILL, entityName: 'Office Depot', account: 'Office Supplies', status: 'pending' },
  { id: 'TXN-004', date: '2023-10-26', amount: 500.00, currency: 'USD', type: TransactionType.PURCHASE, entityName: 'Office Depot', account: 'Office Supplies', status: 'pending' },

  // Duplicate in EUR (Common for EU/Hungary business)
  { id: 'TXN-EUR-1', date: '2023-11-15', amount: 1250.00, currency: 'EUR', type: TransactionType.BILL, entityName: 'German Supplier Gmbh', account: 'Cost of Goods Sold', status: 'pending' },
  { id: 'TXN-EUR-2', date: '2023-11-15', amount: 1250.00, currency: 'EUR', type: TransactionType.BILL, entityName: 'German Supplier Gmbh', account: 'Cost of Goods Sold', status: 'pending' },

  // Same Memo Group (HUF - demonstrating local currency support)
  { id: 'TXN-HUF-1', date: '2023-11-01', amount: 45000.00, currency: 'HUF', type: TransactionType.JOURNAL, entityName: 'Local Consultant', account: 'Professional Services', memo: 'Havi díj Október', status: 'pending' },
  { id: 'TXN-HUF-2', date: '2023-11-05', amount: 45000.00, currency: 'HUF', type: TransactionType.JOURNAL, entityName: 'Local Consultant', account: 'Professional Services', memo: 'Havi díj Október', status: 'pending' },

  // Unique
  { id: 'TXN-007', date: '2023-11-10', amount: 2500.00, currency: 'USD', type: TransactionType.PAYMENT, entityName: 'Global Tech', account: 'Undeposited Funds', status: 'pending' },
];

export const MOCK_SCAN_HISTORY: ScanResult[] = [
  { id: 'SC-100', date: '2023-10-20', duplicatesFound: 12, status: 'Completed' },
  { id: 'SC-101', date: '2023-10-21', duplicatesFound: 0, status: 'Completed' },
  { id: 'SC-102', date: '2023-10-22', duplicatesFound: 5, status: 'Completed' },
  { id: 'SC-103', date: '2023-10-23', duplicatesFound: 0, status: 'Failed' }, // Simulation of auto-restart
  { id: 'SC-103-R', date: '2023-10-23', duplicatesFound: 2, status: 'Completed' }, // Retry
];

// Logic to detect duplicates based on user prompt rules
export const detectDuplicates = (transactions: Transaction[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    const t1 = transactions[i];
    if (processedIds.has(t1.id)) continue;

    const potentialGroup: Transaction[] = [t1];
    let reason = '';
    let confidence = 0;

    for (let j = i + 1; j < transactions.length; j++) {
      const t2 = transactions[j];
      if (processedIds.has(t2.id)) continue;

      // Rule: Must be same currency to be a duplicate in this simple logic
      if (t1.currency !== t2.currency) continue;

      // Rule 1: Same Date AND Same Amount
      const sameDate = t1.date === t2.date;
      const sameAmount = Math.abs(t1.amount - t2.amount) < 0.01;
      const sameEntity = t1.entityName.toLowerCase() === t2.entityName.toLowerCase();
      const sameMemo = t1.memo && t2.memo && t1.memo === t2.memo;
      const sameId = t1.id === t2.id; 
      
      // Fuzzy Amount: Within 1 unit of currency (e.g. $1 or 1 EUR or 1 HUF)
      const closeAmount = Math.abs(t1.amount - t2.amount) <= 1.00 && !sameAmount;

      let isDuplicate = false;

      if (sameDate && sameAmount) {
        reason = `Exact Match (${t1.currency}): Date & Amount`;
        confidence = 0.95;
        isDuplicate = true;
      } else if (sameDate && sameEntity && sameAmount) {
        reason = `Exact Match (${t1.currency}): Date, Entity & Amount`;
        confidence = 0.99;
        isDuplicate = true;
      } else if (sameMemo) {
        reason = 'Duplicate Memo detected';
        confidence = 0.85;
        isDuplicate = true;
      } else if (sameId) {
        reason = 'Duplicate Transaction ID';
        confidence = 1.0;
        isDuplicate = true;
      } else if (closeAmount && (sameDate || sameEntity)) {
        reason = `Fuzzy Match (${t1.currency}): Close Amount`;
        confidence = 0.75;
        isDuplicate = true;
      }

      if (isDuplicate) {
        potentialGroup.push(t2);
        processedIds.add(t2.id);
      }
    }

    if (potentialGroup.length > 1) {
      processedIds.add(t1.id);
      groups.push({
        id: `GRP-${Date.now()}-${i}`,
        reason: reason || 'Potential Duplicate',
        transactions: potentialGroup,
        confidenceScore: confidence
      });
    }
  }

  return groups;
};