<?php

namespace Tests\Feature\Release;

use Illuminate\Filesystem\Filesystem;
use PDO;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class PreV1UpgradeTest extends TestCase
{
    #[Test]
    public function fresh_database_runs_every_migration_and_is_ready_for_passwordless_setup(): void
    {
        $workspace = $this->makeWorkspace();

        try {
            $database = $workspace.'/fresh.sqlite';
            touch($database);
            $this->runArtisan($database, ['migrate:fresh', '--force']);
            $verification = $this->runArtisan($database, ['achelife:verify', '--json']);
            $result = json_decode(trim($verification), true, flags: JSON_THROW_ON_ERROR);

            $this->assertTrue($result['ready']);
            $this->assertSame('ready_for_setup', $result['single_user_state']);
            $this->assertSame([], $result['pending_migrations']);
            $this->assertSame($this->migrationFileCount(), $this->migrationCount($database));
        } finally {
            (new Filesystem)->deleteDirectory($workspace);
        }
    }

    #[Test]
    public function phase_ten_database_upgrades_without_losing_pre_v1_state(): void
    {
        $workspace = $this->makeWorkspace();

        try {
            $database = $workspace.'/upgrade.sqlite';
            $phaseTenMigrations = $workspace.'/phase-ten-migrations';
            touch($database);
            $this->copyPhaseTenMigrations($phaseTenMigrations);
            $this->runArtisan($database, ['migrate', '--force', '--realpath', "--path=$phaseTenMigrations"]);
            $this->seedPhaseTenDatabase($database);

            $backup = $workspace.'/before-v1.sqlite';
            copy($database, $backup);
            $backupChecksum = hash_file('sha256', $backup);
            $this->runArtisan($database, ['migrate', '--force']);

            $connection = $this->connect($database);
            $user = $connection->query('SELECT * FROM users WHERE email = "existing@example.com"')->fetch();
            $season = $connection->query('SELECT * FROM seasons WHERE season_number = 1')->fetch();
            $transaction = $connection->query('SELECT * FROM money_transactions WHERE note = "Legacy charity"')->fetch();

            $this->assertSame('Existing Person', $user['name']);
            $this->assertSame('automatic', $user['season_rollover_preference']);
            $this->assertSame('complete', $user['onboarding_step']);
            $this->assertSame(42, (int) $season['season_points']);
            $this->assertSame(1250, (int) $transaction['amount_minor']);
            $this->assertSame(0, (int) $transaction['fee_minor']);
            $this->assertSame($this->migrationFileCount(), $this->migrationCount($database));
            $this->assertSame($backupChecksum, hash_file('sha256', $backup));
        } finally {
            (new Filesystem)->deleteDirectory($workspace);
        }
    }

    #[Test]
    public function phase_fifteen_database_remains_compatible_with_the_v1_candidate(): void
    {
        $workspace = $this->makeWorkspace();

        try {
            $database = $workspace.'/phase-fifteen.sqlite';
            $phaseFifteenMigrations = $workspace.'/phase-fifteen-migrations';
            touch($database);
            $this->copyPhaseFifteenMigrations($phaseFifteenMigrations);
            $this->runArtisan($database, ['migrate', '--force', '--realpath', "--path=$phaseFifteenMigrations"]);
            $this->seedPhaseFifteenDatabase($database);

            $backup = $workspace.'/before-v1.sqlite';
            copy($database, $backup);
            $backupChecksum = hash_file('sha256', $backup);
            $this->runArtisan($database, ['migrate', '--force']);

            $connection = $this->connect($database);
            $user = $connection->query('SELECT * FROM users WHERE email = "existing@example.com"')->fetch();
            $subscription = $connection->query('SELECT * FROM money_subscriptions WHERE name = "Phase 15 subscription"')->fetch();

            $this->assertSame('complete', $user['onboarding_step']);
            $this->assertNotNull($user['onboarding_completed_at']);
            $this->assertSame(725, (int) $subscription['amount_minor']);
            $this->assertSame('automatic', $subscription['payment_mode']);
            $this->assertSame($this->migrationFileCount(), $this->migrationCount($database));
            $this->assertSame($backupChecksum, hash_file('sha256', $backup));
        } finally {
            (new Filesystem)->deleteDirectory($workspace);
        }
    }

    private function makeWorkspace(): string
    {
        $workspace = sys_get_temp_dir().'/achelife-upgrade-'.bin2hex(random_bytes(8));
        mkdir($workspace, 0700, true);

        return $workspace;
    }

    private function copyPhaseTenMigrations(string $destination): void
    {
        mkdir($destination, 0700, true);

        foreach (glob(database_path('migrations/*.php')) ?: [] as $migration) {
            if (basename($migration) <= '2026_08_19_000000_add_calendar_settings_to_users_table.php') {
                copy($migration, $destination.'/'.basename($migration));
            }
        }
    }

    private function copyPhaseFifteenMigrations(string $destination): void
    {
        mkdir($destination, 0700, true);

        foreach (glob(database_path('migrations/*.php')) ?: [] as $migration) {
            copy($migration, $destination.'/'.basename($migration));
        }
    }

    /** @param list<string> $arguments */
    private function runArtisan(string $database, array $arguments): string
    {
        $process = new Process(
            [PHP_BINARY, 'artisan', ...$arguments],
            base_path(),
            ['APP_ENV' => 'testing', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => $database],
        );
        $process->setTimeout(120);
        $process->mustRun();

        return $process->getOutput();
    }

    private function seedPhaseTenDatabase(string $database): void
    {
        $connection = $this->connect($database);
        $connection->exec("INSERT INTO users (name, email, password, timezone, calendar_started_on, created_at, updated_at) VALUES ('Existing Person', 'existing@example.com', 'hash', 'UTC', '2026-08-01', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO seasons (user_id, season_number, start_date, end_date, season_points, rank, introduced_at, created_at, updated_at) VALUES (1, 1, '2026-08-01', '2026-08-30', 42, NULL, '2026-08-01 00:00:00', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO money_accounts (user_id, name, currency, initial_balance_minor, theme_index, visual_identifier, created_at, updated_at) VALUES (1, 'Main', 'USD', 5000, 1, '1234', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO money_categories (user_id, type, name, builtin_key, created_at, updated_at) VALUES (1, 'expense', 'Charity', 'charity', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO money_transactions (user_id, type, amount_minor, account_id, category_id, transaction_date, note, created_at, updated_at) VALUES (1, 'expense', 1250, 1, 1, '2026-08-05', 'Legacy charity', '2026-08-05 00:00:00', '2026-08-05 00:00:00')");
    }

    private function seedPhaseFifteenDatabase(string $database): void
    {
        $connection = $this->connect($database);
        $connection->exec("INSERT INTO users (name, email, password, timezone, calendar_started_on, season_rollover_preference, onboarding_step, onboarding_completed_at, created_at, updated_at) VALUES ('Existing Person', 'existing@example.com', 'hash', 'UTC', '2026-08-01', 'automatic', 'complete', '2026-08-01 00:00:00', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO seasons (user_id, season_number, start_date, end_date, season_points, rank, introduced_at, created_at, updated_at) VALUES (1, 1, '2026-08-01', '2026-08-30', 42, NULL, '2026-08-01 00:00:00', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO money_accounts (user_id, name, currency, initial_balance_minor, theme_index, visual_identifier, created_at, updated_at) VALUES (1, 'Main', 'USD', 5000, 1, '1234', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO money_categories (user_id, type, name, preset_key, created_at, updated_at) VALUES (1, 'expense', 'Subscriptions', 'money.expense.subscriptions', '2026-08-01 00:00:00', '2026-08-01 00:00:00')");
        $connection->exec("INSERT INTO money_subscriptions (user_id, name, amount_minor, account_id, category_id, starts_on, materialize_from, recurrence, payment_mode, status, anchor_day, created_at, updated_at) VALUES (1, 'Phase 15 subscription', 725, 1, 1, '2026-08-20', '2026-08-20', 'weekly', 'automatic', 'active', 20, '2026-08-20 00:00:00', '2026-08-20 00:00:00')");
    }

    private function connect(string $database): PDO
    {
        $connection = new PDO('sqlite:'.$database);
        $connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $connection->exec('PRAGMA foreign_keys = ON');

        return $connection;
    }

    private function migrationCount(string $database): int
    {
        return (int) $this->connect($database)->query('SELECT COUNT(*) FROM migrations')->fetchColumn();
    }

    private function migrationFileCount(): int
    {
        return count(glob(database_path('migrations/*.php')) ?: []);
    }
}
