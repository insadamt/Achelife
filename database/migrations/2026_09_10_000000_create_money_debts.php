<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', function (Blueprint $table): void {
            $table->unique(['user_id', 'id']);
        });

        Schema::create('money_debts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('person_id');
            $table->enum('direction', ['payable', 'receivable']);
            $table->unsignedBigInteger('original_amount_minor');
            $table->char('currency', 3);
            $table->date('opened_on');
            $table->date('due_on')->nullable();
            $table->string('note', 1000)->nullable();
            $table->unsignedBigInteger('opening_transaction_id')->nullable();
            $table->timestamps();

            $table->foreign(['user_id', 'person_id'])
                ->references(['user_id', 'id'])
                ->on('people')
                ->restrictOnDelete();
            $table->foreign(['user_id', 'opening_transaction_id'])
                ->references(['user_id', 'id'])
                ->on('money_transactions')
                ->restrictOnDelete();
            $table->unique('opening_transaction_id');
            $table->unique(['user_id', 'id']);
            $table->index(['user_id', 'direction', 'due_on']);
            $table->index(['person_id', 'opened_on']);
        });

        Schema::create('money_debt_settlements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('debt_id');
            $table->enum('type', ['repayment', 'forgiveness']);
            $table->unsignedBigInteger('amount_minor');
            $table->date('settled_on');
            $table->string('note', 1000)->nullable();
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->timestamps();

            $table->foreign(['user_id', 'debt_id'])
                ->references(['user_id', 'id'])
                ->on('money_debts')
                ->cascadeOnDelete();
            $table->foreign(['user_id', 'transaction_id'])
                ->references(['user_id', 'id'])
                ->on('money_transactions')
                ->restrictOnDelete();
            $table->unique('transaction_id');
            $table->index(['debt_id', 'settled_on', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_debt_settlements');
        Schema::dropIfExists('money_debts');

        Schema::table('people', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'id']);
        });
    }
};
