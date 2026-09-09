export type MoneyStatisticsPeriod = 'season' | 'month' | 'year' | 'all';

export interface MoneyStatisticsBreakdownItem {
    key: string;
    categoryId: number | null;
    name: string;
    amountMinor: number;
    includesProjectedFees?: boolean;
    subcategories: Array<{
        key: string;
        subcategoryId: number | null;
        name: string;
        amountMinor: number;
    }>;
}

export interface MoneyAccountActivity {
    id: number;
    name: string;
    archived: boolean;
    moneyInMinor: number;
    spendingMinor: number;
    transferredInMinor: number;
    transferredOutMinor: number;
    netMovementMinor: number;
}

export interface MoneyStatisticsSummary {
    totalIncomeMinor: number;
    recordedIncomeMinor: number;
    openingBalanceMinor: number;
    spendingMinor: number;
    netCashFlowMinor: number;
    savingsRate: number | null;
    transactionCount: number;
    averageDailySpendingMinor: number;
    noSpendDays: number;
    elapsedDays: number;
    noSpendRate: number;
    subscriptionSpendingMinor: number;
    transferFeesMinor: number;
    highestSpendingDay: { date: string; amountMinor: number } | null;
    incomeBreakdown: MoneyStatisticsBreakdownItem[];
    spendingBreakdown: MoneyStatisticsBreakdownItem[];
    accounts: MoneyAccountActivity[];
}

export interface MoneyTrendBucket {
    date: string;
    label: string;
    incomeMinor: number;
    openingBalanceMinor: number;
    spendingMinor: number;
    netMinor: number;
}

export interface MoneyStatisticsData {
    filter: MoneyStatisticsPeriod;
    label: string;
    comparisonLabel: string | null;
    selector: {
        value: string | null;
        previousValue: string | null;
        nextValue: string | null;
    };
    range: { start: string | null; end: string };
    currency: string | null;
    currencies: string[];
    accountId: number | null;
    accounts: Array<{ id: number; name: string; archived: boolean }>;
    current: MoneyStatisticsSummary;
    previous: MoneyStatisticsSummary | null;
    trend: {
        unit: 'day' | 'month' | 'year';
        current: MoneyTrendBucket[];
        previous: MoneyTrendBucket[] | null;
    };
}
