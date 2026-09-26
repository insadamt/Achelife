<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appearance_settings', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('surface_style', 16)->default('glass');
            $table->string('background_mime', 32)->nullable();
            $table->string('background_hash', 64)->nullable();
            $table->unsignedInteger('background_bytes')->nullable();
            $table->timestamps();
        });

        Schema::create('appearance_background_chunks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence');
            $table->longText('base64_data');
            $table->unique(['user_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appearance_background_chunks');
        Schema::dropIfExists('appearance_settings');
    }
};
