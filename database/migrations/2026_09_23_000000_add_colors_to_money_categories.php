<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const COLORS = ['#2563EB', '#D97706', '#059669', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#DC2626', '#4F46E5', '#C2410C'];

    public function up(): void
    {
        Schema::table('money_categories', function (Blueprint $table): void {
            $table->char('color', 7)->nullable()->after('name');
        });

        DB::table('money_categories')->orderBy('user_id')->orderBy('type')->orderBy('id')->get()
            ->groupBy(fn (object $category): string => $category->user_id.':'.$category->type)
            ->each(function ($categories): void {
                foreach ($categories->values() as $index => $category) {
                    DB::table('money_categories')->where('id', $category->id)->update(['color' => self::COLORS[$index % count(self::COLORS)]]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('money_categories', function (Blueprint $table): void {
            $table->dropColumn('color');
        });
    }
};
