<?php

namespace App\Http\Requests;

use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionRecurrence;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMoneySubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'amount' => ['required', 'string', 'regex:/^\d{1,12}(?:\.\d{1,2})?$/', 'not_in:0,0.0,0.00'],
            'account_id' => ['required', 'integer'],
            'category_id' => ['required', 'integer'],
            'subcategory_id' => ['nullable', 'integer'],
            'note' => ['nullable', 'string', 'max:1000'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'recurrence' => ['required', Rule::enum(MoneySubscriptionRecurrence::class)],
            'payment_mode' => ['required', Rule::enum(MoneySubscriptionPaymentMode::class)],
        ];
    }
}
