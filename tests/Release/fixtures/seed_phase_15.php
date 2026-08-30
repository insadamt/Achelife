<?php

use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneySubscription;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;

require '/var/www/html/vendor/autoload.php';
$application = require '/var/www/html/bootstrap/app.php';
$application->make(Kernel::class)->bootstrap();

$today = CarbonImmutable::today('UTC');
$seasonStart = $today->subDays(10);
$user = User::query()->create([
    'name' => 'Phase 15 Person',
    'email' => 'phase15@example.invalid',
    'password' => Hash::make(bin2hex(random_bytes(16))),
    'timezone' => 'UTC',
    'calendar_started_on' => $seasonStart,
    'season_rollover_preference' => 'automatic',
    'onboarding_step' => 'complete',
    'onboarding_completed_at' => now(),
]);
$season = Season::query()->create([
    'user_id' => $user->id,
    'season_number' => 1,
    'start_date' => $seasonStart,
    'end_date' => $seasonStart->addDays(29),
    'season_points' => 8,
    'introduced_at' => now(),
]);
Task::query()->create([
    'user_id' => $user->id,
    'title' => 'Persistent upgrade task',
    'scheduled_date' => $today,
    'important' => true,
    'completed_at' => now(),
    'completion_timing' => 'on_time',
    'importance_at_completion' => true,
    'earned_sp' => 8,
    'reward_season_id' => $season->id,
]);
$account = MoneyAccount::query()->create([
    'user_id' => $user->id,
    'name' => 'Persistent account',
    'currency' => 'USD',
    'initial_balance_minor' => 10000,
    'theme_index' => 1,
    'visual_identifier' => '1515',
]);
$category = MoneyCategory::query()->create([
    'user_id' => $user->id,
    'type' => 'expense',
    'name' => 'Persistent subscriptions',
]);
$subscriptionStart = $today->subDay();
MoneySubscription::query()->create([
    'user_id' => $user->id,
    'name' => 'Scheduler acceptance',
    'amount_minor' => 725,
    'account_id' => $account->id,
    'category_id' => $category->id,
    'starts_on' => $subscriptionStart,
    'materialize_from' => $subscriptionStart,
    'recurrence' => 'weekly',
    'payment_mode' => 'automatic',
    'status' => 'active',
    'anchor_day' => (int) $subscriptionStart->format('j'),
]);
file_put_contents(storage_path('app/phase-15-persistence-marker'), 'preserved');

echo json_encode(['user_id' => $user->id, 'season_id' => $season->id], JSON_THROW_ON_ERROR).PHP_EOL;
