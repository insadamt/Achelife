<?php

namespace Tests\Feature\Tasks;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TaskOrganizationMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_tasks_receive_safe_inbox_defaults_without_losing_history(): void
    {
        $migration = require database_path('migrations/2026_09_13_000000_add_task_organization.php');
        $migration->down();
        $user = User::factory()->create();
        $firstId = $this->insertLegacyTask($user, 'First legacy Task', '2026-09-10');
        $secondId = $this->insertLegacyTask($user, 'Second legacy Task', '2026-09-11');

        $migration->up();

        $this->assertTrue(Schema::hasTable('task_folders'));
        $this->assertTrue(Schema::hasTable('task_projects'));
        $this->assertTrue(Schema::hasColumns('tasks', ['task_project_id', 'notes', 'position']));
        $this->assertTrue(Schema::hasColumns('task_series', ['task_project_id', 'notes']));
        $this->assertDatabaseHas('tasks', [
            'id' => $firstId,
            'title' => 'First legacy Task',
            'scheduled_date' => '2026-09-10',
            'task_project_id' => null,
            'notes' => null,
            'position' => 0,
        ]);
        $this->assertDatabaseHas('tasks', [
            'id' => $secondId,
            'title' => 'Second legacy Task',
            'scheduled_date' => '2026-09-11',
            'task_project_id' => null,
            'notes' => null,
            'position' => 1,
        ]);
    }

    private function insertLegacyTask(User $user, string $title, string $date): int
    {
        return DB::table('tasks')->insertGetId([
            'user_id' => $user->id,
            'task_series_id' => null,
            'title' => $title,
            'scheduled_date' => $date,
            'occurrence_date' => null,
            'important' => false,
            'recurrence_type_snapshot' => null,
            'recurrence_weekdays_snapshot' => null,
            'completed_at' => null,
            'completion_timing' => null,
            'importance_at_completion' => null,
            'earned_sp' => null,
            'reward_season_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
