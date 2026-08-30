export type MoneyTransactionType = 'income' | 'expense' | 'transfer';
export type MoneyCategoryType = 'income' | 'expense';

export interface MoneyAccountData {
    id: number;
    name: string;
    currency: string;
    initialBalanceMinor: number;
    balanceMinor: number;
    themeIndex: number;
    visualIdentifier: string;
    archivedAt: string | null;
    hasHistory: boolean;
    canDelete: boolean;
}

export interface MoneySubcategoryData {
    id: number;
    name: string;
    archivedAt: string | null;
    hasHistory: boolean;
    presetKey: string | null;
}

export interface MoneyCategoryData {
    id: number;
    name: string;
    type: MoneyCategoryType;
    presetKey: string | null;
    archivedAt: string | null;
    hasHistory: boolean;
    subcategories: MoneySubcategoryData[];
}

export interface MoneyTransactionAccountData {
    id: number;
    name: string;
    currency: string;
    archived: boolean;
}

export interface MoneyTransactionData {
    id: number;
    type: MoneyTransactionType;
    amountMinor: number;
    feeMinor: number;
    sourceDebitMinor: number | null;
    destinationCreditMinor: number | null;
    feeCategory: { category: string; subcategory: string } | null;
    date: string;
    note: string | null;
    account: MoneyTransactionAccountData;
    destinationAccount: MoneyTransactionAccountData | null;
    category: { id: number; name: string; archived: boolean } | null;
    subcategory: { id: number; name: string; archived: boolean } | null;
    createdAt: string;
    subscriptionOccurrence: { id: number; subscriptionId: number; subscriptionName: string } | null;
}

export type MoneySubscriptionRecurrence = 'weekly' | 'monthly' | 'every_three_months' | 'yearly';
export type MoneySubscriptionPaymentMode = 'automatic' | 'manual';
export type MoneySubscriptionStatus = 'active' | 'paused' | 'ended';
export type MoneySubscriptionOccurrenceStatus = 'due' | 'paid' | 'skipped';

export interface MoneySubscriptionSelectionData {
    id: number;
    name: string;
    archived: boolean;
}

export interface MoneySubscriptionOccurrenceData {
    id: number;
    subscriptionId: number;
    subscriptionName: string;
    paymentMode: MoneySubscriptionPaymentMode;
    dueDate: string;
    amountMinor: number;
    currency: string;
    account: MoneySubscriptionSelectionData;
    category: MoneySubscriptionSelectionData;
    subcategory: MoneySubscriptionSelectionData | null;
    note: string | null;
    status: MoneySubscriptionOccurrenceStatus;
    overdue: boolean;
    transactionId: number | null;
    paidAt: string | null;
    skippedAt: string | null;
    automaticRetryBlockedAt: string | null;
}

export interface MoneySubscriptionData {
    id: number;
    name: string;
    amountMinor: number;
    currency: string;
    account: MoneySubscriptionSelectionData;
    category: MoneySubscriptionSelectionData;
    subcategory: MoneySubscriptionSelectionData | null;
    note: string | null;
    startsOn: string;
    endsOn: string | null;
    recurrence: MoneySubscriptionRecurrence;
    scheduleSentence: string;
    paymentMode: MoneySubscriptionPaymentMode;
    status: MoneySubscriptionStatus;
    nextPayment: string | null;
    canDelete: boolean;
    occurrences: MoneySubscriptionOccurrenceData[];
}

export interface MoneyPageData {
    today: string;
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
}
