<?php

namespace App\Http\Requests;

use App\Enums\MoneyDebtDirection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMoneyDebtRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'direction' => ['required', Rule::enum(MoneyDebtDirection::class)],
            'amount' => ['required', 'string', 'regex:/^\d{1,12}(?:\.\d{1,2})?$/', 'not_in:0,0.0,0.00'],
            'create_person' => ['required', 'boolean'],
            'person_id' => ['nullable', 'required_if:create_person,false', 'integer'],
            'person_name' => ['nullable', 'required_if:create_person,true', 'string', 'max:120'],
            'person_nickname' => ['nullable', 'string', 'max:120'],
            'track_account' => ['required', 'boolean'],
            'account_id' => ['nullable', 'required_if:track_account,true', 'integer'],
            'currency' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'opened_on' => ['required', 'date_format:Y-m-d'],
            'due_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:opened_on'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
