<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->unsignedInteger('money_preset_pack_version')->default(0);
        });

        Schema::table('money_categories', function (Blueprint $table): void {
            $table->string('preset_key')->nullable();
            $table->unique(['user_id', 'preset_key']);
        });

        Schema::table('money_subcategories', function (Blueprint $table): void {
            $table->string('preset_key')->nullable();
            $table->unique(['user_id', 'preset_key']);
        });

        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->unsignedBigInteger('fee_minor')->default(0)->after('amount_minor');
        });

        $this->migrateLegacyCharityCategories();

        Schema::table('money_categories', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'builtin_key']);
            $table->dropColumn('builtin_key');
        });
    }

    public function down(): void
    {
        Schema::table('money_categories', function (Blueprint $table): void {
            $table->string('builtin_key')->nullable();
            $table->unique(['user_id', 'builtin_key']);
        });

        Schema::table('money_transactions', function (Blueprint $table): void {
            $table->dropColumn('fee_minor');
        });

        Schema::table('money_subcategories', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'preset_key']);
            $table->dropColumn('preset_key');
        });

        Schema::table('money_categories', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'preset_key']);
            $table->dropColumn('preset_key');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('money_preset_pack_version');
        });
    }

    private function migrateLegacyCharityCategories(): void
    {
        DB::table('money_categories')
            ->where('builtin_key', 'charity')
            ->eachById(function (object $legacyCharity): void {
                DB::transaction(function () use ($legacyCharity): void {
                    $giftsAndDonationsId = DB::table('money_categories')->insertGetId([
                        'user_id' => $legacyCharity->user_id,
                        'type' => 'expense',
                        'name' => 'Gifts & Donations',
                        'builtin_key' => null,
                        'preset_key' => 'money.expense.gifts-donations',
                        'archived_at' => null,
                        'created_at' => $legacyCharity->created_at,
                        'updated_at' => $legacyCharity->updated_at,
                    ]);

                    $charitySubcategoryId = DB::table('money_subcategories')->insertGetId([
                        'user_id' => $legacyCharity->user_id,
                        'category_id' => $giftsAndDonationsId,
                        'name' => 'Charity',
                        'preset_key' => 'money.expense.gifts-donations.charity',
                        'archived_at' => null,
                        'created_at' => $legacyCharity->created_at,
                        'updated_at' => $legacyCharity->updated_at,
                    ]);

                    DB::table('money_subcategories')
                        ->where('category_id', $legacyCharity->id)
                        ->update(['category_id' => $giftsAndDonationsId]);

                    DB::table('money_transactions')
                        ->where('category_id', $legacyCharity->id)
                        ->whereNull('subcategory_id')
                        ->update([
                            'category_id' => $giftsAndDonationsId,
                            'subcategory_id' => $charitySubcategoryId,
                        ]);

                    DB::table('money_transactions')
                        ->where('category_id', $legacyCharity->id)
                        ->update(['category_id' => $giftsAndDonationsId]);

                    DB::table('money_categories')->where('id', $legacyCharity->id)->delete();
                });
            }, 100, 'id');
    }
};
