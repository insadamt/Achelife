<?php

namespace Tests\Feature\Tasks;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TaskFocusMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_focus_schema_has_portable_session_and_interval_state(): void
    {
        $this->assertTrue(Schema::hasColumns('task_focus_sessions', [
            'id',
            'user_id',
            'task_id',
            'started_at',
            'ended_at',
            'accumulated_seconds',
            'state',
            'source',
            'active_marker',
        ]));
        $this->assertTrue(Schema::hasColumns('task_focus_intervals', [
            'id',
            'task_focus_session_id',
            'started_at',
            'ended_at',
        ]));
    }

    public function test_focus_migration_rolls_back_and_reapplies_cleanly(): void
    {
        $migration = require database_path('migrations/2026_09_13_010000_create_task_focus_tables.php');

        $migration->down();
        $this->assertFalse(Schema::hasTable('task_focus_sessions'));
        $this->assertFalse(Schema::hasTable('task_focus_intervals'));

        $migration->up();
        $this->assertTrue(Schema::hasTable('task_focus_sessions'));
        $this->assertTrue(Schema::hasTable('task_focus_intervals'));
    }
}
