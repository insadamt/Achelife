<?php

namespace App\Services\Money;

use App\Data\Money\MoneyTransactionData;
use App\Models\MoneyMerchant;
use App\Models\MoneyTag;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Support\Money\MoneyMerchantName;
use App\Support\Money\MoneyTagName;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class MoneyTransactionMetadata
{
    private const TAG_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#D97706', '#059669', '#0891B2', '#4F46E5'];

    public function __construct(
        private readonly MoneyMerchantName $merchantName,
        private readonly MoneyTagName $tagName,
    ) {}

    /** @return array{merchantId: ?int, tags: Collection<int, MoneyTag>} */
    public function createOrFind(User $user, MoneyTransactionData $data, ?MoneyTransaction $existing = null): array
    {
        $merchant = $this->createOrFindMerchant($user, $data->merchantName, $existing);
        $tags = collect($data->tagNames)
            ->map(fn (string $name): MoneyTag => $this->createOrFindTag($user, $name, $existing));

        return ['merchantId' => $merchant?->id, 'tags' => $tags];
    }

    /** @param Collection<int, MoneyTag> $tags */
    public function assignTags(User $user, MoneyTransaction $transaction, Collection $tags): void
    {
        $assignments = $tags->mapWithKeys(fn (MoneyTag $tag): array => [
            $tag->id => ['user_id' => $user->id],
        ])->all();

        $transaction->tags()->sync($assignments);
    }

    private function createOrFindMerchant(User $user, ?string $name, ?MoneyTransaction $existing): ?MoneyMerchant
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        $displayName = $this->merchantName->display($name);
        $normalizedName = $this->merchantName->normalized($name);
        $merchant = $user->moneyMerchants()->where('normalized_name', $normalizedName)->first();

        if ($merchant?->archived_at !== null && $existing?->merchant_id !== $merchant->id) {
            throw ValidationException::withMessages([
                'merchant' => 'Archived Merchants cannot be selected for new financial activity. Reactivate it first.',
            ]);
        }

        return $merchant ?? $user->moneyMerchants()->create([
            'normalized_name' => $normalizedName,
            'name' => $displayName,
        ]);
    }

    private function createOrFindTag(User $user, string $name, ?MoneyTransaction $existing): MoneyTag
    {
        $displayName = $this->tagName->display($name);
        $normalizedName = $this->tagName->normalized($name);
        $tag = $user->moneyTags()->where('normalized_name', $normalizedName)->first();

        if ($tag?->archived_at !== null && ! $existing?->tags()->whereKey($tag->id)->exists()) {
            throw ValidationException::withMessages([
                'tags' => 'Archived Tags cannot be selected for new financial activity. Reactivate them first.',
            ]);
        }

        return $tag ?? $user->moneyTags()->create([
            'normalized_name' => $normalizedName,
            'name' => $displayName,
            'color' => $this->automaticColor($normalizedName),
        ]);
    }

    private function automaticColor(string $normalizedName): string
    {
        $index = (int) sprintf('%u', crc32($normalizedName)) % count(self::TAG_COLORS);

        return self::TAG_COLORS[$index];
    }
}
