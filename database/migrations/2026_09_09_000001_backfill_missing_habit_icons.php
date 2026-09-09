<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('habits')->whereNull('icon')->update(['icon' => 'check']);
    }

    public function down(): void {}
};
