<?php

namespace App\Services\Money;

use App\Data\Money\MoneySubscriptionData;
use App\Data\Money\MoneySubscriptionPaymentData;
use App\Enums\MoneyCategoryType;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneySubcategory;
use App\Models\MoneySubscription;
use App\Models\MoneySubscriptionOccurrence;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class MoneySubscriptionValidator
{
    public function validateDefinition(User $user, MoneySubscriptionData $data, ?MoneySubscription $existing = null): void
    {
        if ($data->amountMinor <= 0) {
            $this->fail('amount', 'The amount must be greater than zero.');
        }
        if ($data->endsOn !== null && $data->endsOn->isBefore($data->startsOn)) {
            $this->fail('end_date', 'The end date must be on or after the start date.');
        }

        $this->validateSelections(
            $user,
            $data->accountId,
            $data->categoryId,
            $data->subcategoryId,
            $existing?->account_id,
            $existing?->category_id,
            $existing?->subcategory_id,
        );
    }

    public function validatePayment(User $user, MoneySubscriptionPaymentData $data, MoneySubscriptionOccurrence $occurrence): void
    {
        if ($data->amountMinor <= 0) {
            $this->fail('amount', 'The amount must be greater than zero.');
        }

        $this->validateSelections(
            $user,
            $data->accountId,
            $data->categoryId,
            $data->subcategoryId,
            $occurrence->account_id,
            $occurrence->category_id,
            $occurrence->subcategory_id,
        );
    }

    private function validateSelections(
        User $user,
        int $accountId,
        int $categoryId,
        ?int $subcategoryId,
        ?int $retainedAccountId,
        ?int $retainedCategoryId,
        ?int $retainedSubcategoryId,
    ): void {
        $account = $user->moneyAccounts()->find($accountId);
        if (! $account) {
            $this->fail('account_id', 'The selected Account does not belong to you.');
        }
        $this->requireActiveUnlessRetained($account, $retainedAccountId, 'account_id');

        $category = $user->moneyCategories()->find($categoryId);
        if (! $category) {
            $this->fail('category_id', 'The selected Category does not belong to you.');
        }
        if ($category->type !== MoneyCategoryType::Expense) {
            $this->fail('category_id', 'Subscriptions require an Expense Category.');
        }
        $this->requireActiveUnlessRetained($category, $retainedCategoryId, 'category_id');

        if ($subcategoryId === null) {
            return;
        }

        $subcategory = $user->moneySubcategories()->with('category')->find($subcategoryId);
        if (! $subcategory || $subcategory->category_id !== $category->id) {
            $this->fail('subcategory_id', 'The selected Subcategory must belong to the chosen Category.');
        }
        $this->requireActiveUnlessRetained($subcategory, $retainedSubcategoryId, 'subcategory_id');
        if ($subcategory->category->archived_at !== null && $subcategory->id !== $retainedSubcategoryId) {
            $this->fail('subcategory_id', 'This Subcategory is unavailable because its parent Category is archived.');
        }
    }

    private function requireActiveUnlessRetained(MoneyAccount|MoneyCategory|MoneySubcategory $entity, ?int $retainedId, string $field): void
    {
        if ($entity->archived_at !== null && $entity->id !== $retainedId) {
            $this->fail($field, 'Archived items cannot be selected for new Subscription activity.');
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
