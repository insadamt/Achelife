<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const INDEX_NAME = 'money_transactions_user_id_id_subscription_unique';

    public function up(): void
    {
        if ($this->hasUniqueUserTransactionKey()) {
            return;
        }

        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->unique(['user_id', 'id'], self::INDEX_NAME);
        });
    }

    public function down(): void
    {
        if (! $this->hasIndex(self::INDEX_NAME)) {
            return;
        }

        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->dropUnique(self::INDEX_NAME);
        });
    }

    private function hasUniqueUserTransactionKey(): bool
    {
        return collect(Schema::getIndexes('money_transactions'))->contains(
            fn (array $index): bool => ($index['unique'] ?? false)
                && ($index['columns'] ?? []) === ['user_id', 'id'],
        );
    }

    private function hasIndex(string $name): bool
    {
        return collect(Schema::getIndexes('money_transactions'))->contains(
            fn (array $index): bool => ($index['name'] ?? null) === $name,
        );
    }
};
