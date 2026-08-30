<?php

use App\Models\MoneySubscriptionOccurrence;
use App\Models\MoneyTransaction;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require '/var/www/html/vendor/autoload.php';
$application = require '/var/www/html/bootstrap/app.php';
$application->make(Kernel::class)->bootstrap();

$migrator = app('migrator');
$migrationFiles = $migrator->getMigrationFiles(database_path('migrations'));
$pendingMigrations = array_diff(array_keys($migrationFiles), $migrator->getRepository()->getRan());
$paidOccurrenceTransactionIds = MoneySubscriptionOccurrence::query()
    ->where('status', 'paid')
    ->pluck('transaction_id');
$result = [
    'profile_count' => User::query()->count(),
    'season_points' => Season::query()->sole()->season_points,
    'task_reward' => Task::query()->where('title', 'Persistent upgrade task')->sole()->earned_sp,
    'paid_occurrences' => MoneySubscriptionOccurrence::query()->where('status', 'paid')->count(),
    'subscription_expenses' => MoneyTransaction::query()
        ->whereIn('id', $paidOccurrenceTransactionIds)
        ->where('type', 'expense')
        ->where('amount_minor', 725)
        ->count(),
    'pending_migrations' => count($pendingMigrations),
    'storage_marker' => file_get_contents(storage_path('app/phase-15-persistence-marker')),
];

if ($result !== [
    'profile_count' => 1,
    'season_points' => 8,
    'task_reward' => 8,
    'paid_occurrences' => 1,
    'subscription_expenses' => 1,
    'pending_migrations' => 0,
    'storage_marker' => 'preserved',
]) {
    fwrite(STDERR, json_encode($result, JSON_THROW_ON_ERROR).PHP_EOL);
    exit(1);
}

echo json_encode($result, JSON_THROW_ON_ERROR).PHP_EOL;
