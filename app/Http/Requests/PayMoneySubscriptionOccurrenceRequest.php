<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayMoneySubscriptionOccurrenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'string', 'regex:/^\d{1,12}(?:\.\d{1,2})?$/', 'not_in:0,0.0,0.00'],
            'account_id' => ['required', 'integer'],
            'category_id' => ['required', 'integer'],
            'subcategory_id' => ['nullable', 'integer'],
            'note' => ['nullable', 'string', 'max:1000'],
            'apply_to_future' => ['required', 'boolean'],
        ];
    }
}
