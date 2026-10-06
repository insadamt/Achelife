<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->foreignId('person_id')->nullable();
            $table->foreign(['user_id', 'person_id'])
                ->references(['user_id', 'id'])->on('people')->restrictOnDelete();
            $table->index(['person_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->dropForeign(['user_id', 'person_id']);
            $table->dropIndex(['person_id', 'transaction_date']);
            $table->dropColumn('person_id');
        });
    }
};
