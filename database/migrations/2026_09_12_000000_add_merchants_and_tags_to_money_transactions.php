<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('money_merchants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('normalized_name', 120);
            $table->timestamps();

            $table->unique(['user_id', 'normalized_name']);
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_tags', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('normalized_name', 50);
            $table->string('color', 7)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'normalized_name']);
            $table->unique(['user_id', 'id']);
        });

        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->foreignId('merchant_id')->nullable()->after('subcategory_id');
            $table->foreign(['user_id', 'merchant_id'])
                ->references(['user_id', 'id'])
                ->on('money_merchants')
                ->restrictOnDelete();
            $table->index(['merchant_id', 'transaction_date']);
        });

        Schema::create('money_transaction_tags', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id');
            $table->foreignId('tag_id');
            $table->timestamps();

            $table->foreign(['user_id', 'transaction_id'])
                ->references(['user_id', 'id'])
                ->on('money_transactions')
                ->cascadeOnDelete();
            $table->foreign(['user_id', 'tag_id'])
                ->references(['user_id', 'id'])
                ->on('money_tags')
                ->restrictOnDelete();
            $table->unique(['transaction_id', 'tag_id']);
            $table->unique(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_transaction_tags');

        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->dropForeign(['user_id', 'merchant_id']);
            $table->dropIndex(['merchant_id', 'transaction_date']);
            $table->dropColumn('merchant_id');
        });

        Schema::dropIfExists('money_tags');
        Schema::dropIfExists('money_merchants');
    }
};
