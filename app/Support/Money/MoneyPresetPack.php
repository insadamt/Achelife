<?php

namespace App\Support\Money;

use App\Enums\MoneyCategoryType;
use App\Models\User;

class MoneyPresetPack
{
    public const VERSION = 1;

    public const FINANCIAL_CATEGORY_KEY = 'money.expense.financial';

    public const BANK_FEES_SUBCATEGORY_KEY = 'money.expense.financial.bank-fees';

    /** @return list<array{key: string, name: string, type: MoneyCategoryType, subcategories: list<array{key: string, name: string}>}> */
    public function definitions(): array
    {
        return [
            $this->category(MoneyCategoryType::Expense, 'housing', 'Housing', ['Rent', 'Mortgage', 'Home Maintenance', 'Furniture', 'Household Supplies']),
            $this->category(MoneyCategoryType::Expense, 'food', 'Food', ['Groceries', 'Restaurants', 'Fast Food', 'Café', 'Delivery']),
            $this->category(MoneyCategoryType::Expense, 'transport', 'Transport', ['Fuel', 'Public Transport', 'Taxi / Ride Sharing', 'Parking', 'Tolls', 'Vehicle Maintenance']),
            $this->category(MoneyCategoryType::Expense, 'shopping', 'Shopping', ['Clothing', 'Electronics', 'Personal Items', 'Online Shopping', 'Other Shopping']),
            $this->category(MoneyCategoryType::Expense, 'bills-utilities', 'Bills & Utilities', ['Electricity', 'Water', 'Internet', 'Mobile', 'Gas']),
            $this->category(MoneyCategoryType::Expense, 'health', 'Health', ['Doctor', 'Pharmacy', 'Dental', 'Vision', 'Medical Tests']),
            $this->category(MoneyCategoryType::Expense, 'entertainment', 'Entertainment', ['Games', 'Movies', 'Events', 'Hobbies', 'Music']),
            $this->category(MoneyCategoryType::Expense, 'education', 'Education', ['Courses', 'Books', 'Tuition', 'Software', 'Certifications']),
            $this->category(MoneyCategoryType::Expense, 'personal-care', 'Personal Care', ['Barber / Hairdresser', 'Cosmetics', 'Hygiene', 'Spa']),
            $this->category(MoneyCategoryType::Expense, 'family', 'Family', ['Parents', 'Children', 'Family Support', 'Household Contribution']),
            $this->category(MoneyCategoryType::Expense, 'gifts-donations', 'Gifts & Donations', ['Gifts', 'Charity', 'Donations']),
            $this->category(MoneyCategoryType::Expense, 'travel', 'Travel', ['Flights', 'Hotels', 'Local Transport', 'Food', 'Activities']),
            $this->category(MoneyCategoryType::Expense, 'financial', 'Financial', ['Bank Fees', 'Interest', 'Taxes', 'Insurance']),
            $this->category(MoneyCategoryType::Expense, 'other', 'Other', ['Miscellaneous', 'Uncategorized']),
            $this->category(MoneyCategoryType::Income, 'work', 'Work', ['Salary', 'Bonus', 'Overtime']),
            $this->category(MoneyCategoryType::Income, 'freelance', 'Freelance', ['Freelance Work', 'Contract Work']),
            $this->category(MoneyCategoryType::Income, 'business', 'Business', ['Sales', 'Services', 'Other Business Income']),
            $this->category(MoneyCategoryType::Income, 'investments', 'Investments', ['Dividends', 'Interest', 'Capital Gains']),
            $this->category(MoneyCategoryType::Income, 'gifts', 'Gifts', ['Family', 'Friends', 'Other']),
            $this->category(MoneyCategoryType::Income, 'other-income', 'Other Income', ['Prize', 'Sale of Belongings', 'Miscellaneous']),
        ];
    }

    /** @return array<string, mixed> */
    public function preview(User $user): array
    {
        $installedCategoryKeys = $user->moneyCategories()->whereNotNull('preset_key')->pluck('preset_key')->all();
        $installedSubcategoryKeys = $user->moneySubcategories()->whereNotNull('preset_key')->pluck('preset_key')->all();
        $definitions = $this->definitions();
        $categoryCount = count($definitions);
        $subcategoryCount = array_sum(array_map(fn (array $definition): int => count($definition['subcategories']), $definitions));

        return [
            'version' => self::VERSION,
            'installedVersion' => $user->money_preset_pack_version,
            'categoryCount' => $categoryCount,
            'subcategoryCount' => $subcategoryCount,
            'missingCategoryCount' => $categoryCount - count(array_intersect($installedCategoryKeys, array_column($definitions, 'key'))),
            'missingSubcategoryCount' => $subcategoryCount - count(array_intersect($installedSubcategoryKeys, $this->subcategoryKeys($definitions))),
            'categories' => array_map(fn (array $definition): array => [
                'key' => $definition['key'],
                'name' => $definition['name'],
                'type' => $definition['type']->value,
                'subcategories' => array_column($definition['subcategories'], 'name'),
            ], $definitions),
        ];
    }

    /** @param list<array{key: string, name: string, type: MoneyCategoryType, subcategories: list<array{key: string, name: string}>}> $definitions
     * @return list<string>
     */
    private function subcategoryKeys(array $definitions): array
    {
        return array_merge(...array_map(
            fn (array $definition): array => array_column($definition['subcategories'], 'key'),
            $definitions,
        ));
    }

    /** @return array{key: string, name: string, type: MoneyCategoryType, subcategories: list<array{key: string, name: string}>} */
    private function category(MoneyCategoryType $type, string $slug, string $name, array $subcategoryNames): array
    {
        $categoryKey = "money.{$type->value}.{$slug}";

        return [
            'key' => $categoryKey,
            'name' => $name,
            'type' => $type,
            'subcategories' => array_map(fn (string $subcategoryName): array => [
                'key' => $categoryKey.'.'.$this->keySegment($subcategoryName),
                'name' => $subcategoryName,
            ], $subcategoryNames),
        ];
    }

    private function keySegment(string $name): string
    {
        return match ($name) {
            'Café' => 'cafe',
            'Taxi / Ride Sharing' => 'taxi-ride-sharing',
            'Barber / Hairdresser' => 'barber-hairdresser',
            default => strtolower(str_replace([' & ', ' / ', ' '], '-', $name)),
        };
    }
}
