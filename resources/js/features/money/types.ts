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
}

export interface MoneyCategoryData {
    id: number;
    name: string;
    type: MoneyCategoryType;
    builtIn: boolean;
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
    date: string;
    note: string | null;
    account: MoneyTransactionAccountData;
    destinationAccount: MoneyTransactionAccountData | null;
    category: { id: number; name: string; archived: boolean } | null;
    subcategory: { id: number; name: string; archived: boolean } | null;
    createdAt: string;
}

export interface MoneyPageData {
    today: string;
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
}
