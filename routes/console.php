<?php

use App\Actions\Money\SynchronizeAllMoneySubscriptions;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('achelife:verify {--json}', function () {
    $migrator = app('migrator');
    $migrationFiles = $migrator->getMigrationFiles(database_path('migrations'));
    $ranMigrations = $migrator->getRepository()->getRan();
    $pendingMigrations = array_values(array_diff(array_keys($migrationFiles), $ranMigrations));
    $databaseReady = Schema::hasTable('users');
    $profileCount = $databaseReady ? User::query()->count() : 0;
    $storageReady = is_writable(storage_path('app'));
    $ready = $databaseReady && $storageReady && $pendingMigrations === [] && $profileCount <= 1;

    $result = [
        'ready' => $ready,
        'version' => config('achelife.application_version'),
        'database' => $databaseReady ? 'ready' : 'unavailable',
        'storage' => $storageReady ? 'writable' : 'unavailable',
        'pending_migrations' => $pendingMigrations,
        'profile_count' => $profileCount,
        'single_user_state' => match (true) {
            $profileCount === 0 => 'ready_for_setup',
            $profileCount === 1 => 'ready',
            default => 'conflict',
        },
    ];

    if ($this->option('json')) {
        $this->line(json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    } elseif (! $ready) {
        $this->error('Achelife operational verification failed.');
    }

    return $ready ? Command::SUCCESS : Command::FAILURE;
})->purpose('Verify migrations, persistence, and single-user readiness');

Schedule::call(fn () => app(SynchronizeAllMoneySubscriptions::class)->execute())
    ->daily()
    ->name('money-subscriptions:synchronize')
    ->withoutOverlapping();
