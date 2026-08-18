<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('money_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->char('currency', 3);
            $table->bigInteger('initial_balance_minor');
            $table->unsignedTinyInteger('theme_index');
            $table->char('visual_identifier', 4);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'archived_at', 'created_at']);
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['income', 'expense']);
            $table->string('name');
            $table->string('builtin_key')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'builtin_key']);
            $table->index(['user_id', 'type', 'archived_at', 'name']);
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_subcategories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id');
            $table->string('name');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->foreign(['user_id', 'category_id'])
                ->references(['user_id', 'id'])
                ->on('money_categories')
                ->cascadeOnDelete();
            $table->index(['category_id', 'archived_at', 'name']);
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['income', 'expense', 'transfer']);
            $table->unsignedBigInteger('amount_minor');
            $table->foreignId('account_id');
            $table->foreignId('destination_account_id')->nullable();
            $table->foreignId('category_id')->nullable();
            $table->foreignId('subcategory_id')->nullable();
            $table->date('transaction_date');
            $table->string('note', 1000)->nullable();
            $table->timestamps();

            $table->foreign(['user_id', 'account_id'])
                ->references(['user_id', 'id'])
                ->on('money_accounts')
                ->restrictOnDelete();
            $table->foreign(['user_id', 'destination_account_id'])
                ->references(['user_id', 'id'])
                ->on('money_accounts')
                ->restrictOnDelete();
            $table->foreign(['user_id', 'category_id'])
                ->references(['user_id', 'id'])
                ->on('money_categories')
                ->restrictOnDelete();
            $table->foreign(['user_id', 'subcategory_id'])
                ->references(['user_id', 'id'])
                ->on('money_subcategories')
                ->restrictOnDelete();
            $table->index(['user_id', 'transaction_date', 'id']);
            $table->index(['account_id', 'transaction_date']);
            $table->index(['destination_account_id', 'transaction_date']);
            $table->index(['category_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_transactions');
        Schema::dropIfExists('money_subcategories');
        Schema::dropIfExists('money_categories');
        Schema::dropIfExists('money_accounts');
    }
};
