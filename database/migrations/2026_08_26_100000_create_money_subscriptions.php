<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedBigInteger('amount_minor');
            $table->foreignId('account_id');
            $table->foreignId('category_id');
            $table->foreignId('subcategory_id')->nullable();
            $table->string('note', 1000)->nullable();
            $table->date('starts_on');
            $table->date('materialize_from');
            $table->date('ends_on')->nullable();
            $table->enum('recurrence', ['weekly', 'monthly', 'every_three_months', 'yearly']);
            $table->enum('payment_mode', ['automatic', 'manual']);
            $table->enum('status', ['active', 'paused', 'ended'])->default('active');
            $table->unsignedTinyInteger('anchor_day');
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->foreign(['user_id', 'account_id'])->references(['user_id', 'id'])->on('money_accounts')->restrictOnDelete();
            $table->foreign(['user_id', 'category_id'])->references(['user_id', 'id'])->on('money_categories')->restrictOnDelete();
            $table->foreign(['user_id', 'subcategory_id'])->references(['user_id', 'id'])->on('money_subcategories')->restrictOnDelete();
            $table->index(['user_id', 'status', 'starts_on']);
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_subscription_occurrences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id');
            $table->date('due_date');
            $table->unsignedBigInteger('amount_minor');
            $table->foreignId('account_id');
            $table->foreignId('category_id');
            $table->foreignId('subcategory_id')->nullable();
            $table->string('note', 1000)->nullable();
            $table->enum('status', ['due', 'paid', 'skipped'])->default('due');
            $table->foreignId('transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('skipped_at')->nullable();
            $table->timestamps();

            $table->foreign(['user_id', 'subscription_id'])->references(['user_id', 'id'])->on('money_subscriptions')->cascadeOnDelete();
            $table->foreign(['user_id', 'account_id'])->references(['user_id', 'id'])->on('money_accounts')->restrictOnDelete();
            $table->foreign(['user_id', 'category_id'])->references(['user_id', 'id'])->on('money_categories')->restrictOnDelete();
            $table->foreign(['user_id', 'subcategory_id'])->references(['user_id', 'id'])->on('money_subcategories')->restrictOnDelete();
            $table->foreign(['user_id', 'transaction_id'])->references(['user_id', 'id'])->on('money_transactions')->restrictOnDelete();
            $table->unique(['subscription_id', 'due_date']);
            $table->unique('transaction_id');
            $table->index(['user_id', 'status', 'due_date']);
            $table->unique(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_subscription_occurrences');
        Schema::dropIfExists('money_subscriptions');
        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'id']);
        });
    }
};
