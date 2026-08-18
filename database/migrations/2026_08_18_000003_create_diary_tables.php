<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('nickname')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'archived_at', 'name']);
        });

        Schema::create('diary_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('season_id')->constrained('seasons')->restrictOnDelete();
            $table->date('entry_date');
            $table->json('content');
            $table->text('plain_text');
            $table->unsignedInteger('valid_character_count')->default(0);
            $table->string('language_code', 16)->nullable();
            $table->string('language_name_snapshot')->nullable();
            $table->string('mood')->nullable();
            $table->string('mood_group')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->unsignedInteger('streak_after')->default(0);
            $table->decimal('reward_multiplier', 3, 1)->default(0);
            $table->unsignedSmallInteger('earned_sp')->default(0);
            $table->unsignedBigInteger('client_revision')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'entry_date']);
            $table->index(['user_id', 'season_id', 'entry_date']);
            $table->index(['user_id', 'language_code']);
            $table->index(['user_id', 'mood']);
        });

        Schema::create('diary_entry_mentions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('diary_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('person_id')->constrained('people')->restrictOnDelete();
            $table->unsignedInteger('node_index');
            $table->string('display_text');
            $table->timestamps();

            $table->unique(['diary_entry_id', 'node_index']);
            $table->index(['person_id', 'diary_entry_id']);
        });

        Schema::create('diary_settings', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->json('languages');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diary_settings');
        Schema::dropIfExists('diary_entry_mentions');
        Schema::dropIfExists('diary_entries');
        Schema::dropIfExists('people');
    }
};
