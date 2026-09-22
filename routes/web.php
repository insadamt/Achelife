<?php

use App\Http\Controllers\AccountPortabilityController;
use App\Http\Controllers\AccountSettingController;
use App\Http\Controllers\ArchiveHabitController;
use App\Http\Controllers\ArchiveLawController;
use App\Http\Controllers\ConstitutionController;
use App\Http\Controllers\DiaryController;
use App\Http\Controllers\DiarySettingController;
use App\Http\Controllers\GeneralSettingController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\HabitOccurrenceController;
use App\Http\Controllers\HabitSettingController;
use App\Http\Controllers\HabitStatisticsController;
use App\Http\Controllers\LawController;
use App\Http\Controllers\MoneyAccountController;
use App\Http\Controllers\MoneyArchiveController;
use App\Http\Controllers\MoneyCategoryController;
use App\Http\Controllers\MoneyController;
use App\Http\Controllers\MoneyDebtController;
use App\Http\Controllers\MoneyDebtForgivenessController;
use App\Http\Controllers\MoneyDebtPageController;
use App\Http\Controllers\MoneyDebtRepaymentController;
use App\Http\Controllers\MoneyHistoryController;
use App\Http\Controllers\MoneyMerchantController;
use App\Http\Controllers\MoneyOrganizationController;
use App\Http\Controllers\MoneyPresetController;
use App\Http\Controllers\MoneyStatisticsController;
use App\Http\Controllers\MoneySubcategoryController;
use App\Http\Controllers\MoneySubscriptionController;
use App\Http\Controllers\MoneySubscriptionOccurrenceController;
use App\Http\Controllers\MoneySubscriptionPageController;
use App\Http\Controllers\MoneyTagController;
use App\Http\Controllers\MoneyTransactionController;
use App\Http\Controllers\ObjectiveCompletionController;
use App\Http\Controllers\ObjectiveController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\SeasonCloseoutController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeasonCycleController;
use App\Http\Controllers\SeasonInsightsController;
use App\Http\Controllers\SeasonIntroductionController;
use App\Http\Controllers\SeasonRankGuideController;
use App\Http\Controllers\SingleUserSetupController;
use App\Http\Controllers\StopTaskSeriesController;
use App\Http\Controllers\SubtaskCompletionController;
use App\Http\Controllers\TaskCompletionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskFocusSessionController;
use App\Http\Controllers\TaskFolderController;
use App\Http\Controllers\TaskFolderOrderController;
use App\Http\Controllers\TaskMovementController;
use App\Http\Controllers\TaskOrderController;
use App\Http\Controllers\TaskProjectController;
use App\Http\Controllers\TaskProjectMovementController;
use App\Http\Controllers\TaskProjectOrderController;
use App\Http\Controllers\TaskStatisticsController;
use App\Http\Controllers\TodayController;
use App\Http\Controllers\TodaySettingController;
use App\Http\Controllers\ViolationController;
use App\Http\Middleware\EnsureOnboardingIsComplete;
use App\Http\Middleware\SynchronizeSeasonState;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/home');

Route::middleware('guest')->group(function (): void {
    Route::get('/setup', [SingleUserSetupController::class, 'create'])->name('setup');
    Route::post('/setup', [SingleUserSetupController::class, 'store'])
        ->middleware('throttle:5,1');
});

Route::middleware('auth')->group(function (): void {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding/restore/preview', [AccountPortabilityController::class, 'previewFresh'])->name('onboarding.restore.preview');
    Route::post('/onboarding/restore', [AccountPortabilityController::class, 'restoreFresh'])->name('onboarding.restore');
    Route::post('/onboarding/{step}', [OnboardingController::class, 'update'])
        ->middleware('throttle:20,1')
        ->name('onboarding.update');

    Route::middleware(EnsureOnboardingIsComplete::class)->group(function (): void {
        Route::middleware(SynchronizeSeasonState::class)->group(function (): void {
            Route::get('/home', TodayController::class)->name('home');
            Route::get('/seasons', SeasonController::class)->name('seasons.index');
            Route::get('/seasons/ranks', SeasonRankGuideController::class)->name('seasons.ranks');
            Route::get('/seasons/{season}/insights', SeasonInsightsController::class)->name('seasons.insights');
            Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
            Route::get('/tasks/statistics', TaskStatisticsController::class)->name('tasks.statistics');
            Route::get('/habits', [HabitController::class, 'index'])->name('habits.index');
            Route::get('/habits/{habit}/statistics', HabitStatisticsController::class)->name('habits.statistics');
            Route::get('/habits/archived', [HabitController::class, 'archived'])->name('habits.archived');
            Route::get('/diary', [DiaryController::class, 'index'])->name('diary.index');
            Route::get('/constitution', [ConstitutionController::class, 'index'])->name('constitution.index');
            Route::get('/constitution/archived', [ConstitutionController::class, 'archived'])->name('constitution.archived');
            Route::get('/money', [MoneyController::class, 'index'])->name('money.index');
            Route::get('/money/debts', MoneyDebtPageController::class)->name('money.debts.index');
            Route::get('/money/history', MoneyHistoryController::class)->name('money.history');
            Route::get('/money/accounts/archived', [MoneyArchiveController::class, 'accounts'])->name('money.accounts.archived');
            Route::get('/money/organization', MoneyOrganizationController::class)->name('money.organization.index');
            Route::redirect('/money/categories', '/money/organization?section=categories')->name('money.categories.index');
            Route::redirect('/money/merchants', '/money/organization?section=merchants')->name('money.merchants.index');
            Route::get('/money/subscriptions', MoneySubscriptionPageController::class)->name('money.subscriptions.index');
            Route::get('/money/statistics', MoneyStatisticsController::class)->name('money.statistics');
            Route::get('/money/accounts/{account}', [MoneyAccountController::class, 'show'])->name('money.accounts.show');
            Route::get('/settings/general', [GeneralSettingController::class, 'index'])->name('settings.general');
        });
        Route::get('/seasons/{season}/closeout', [SeasonCloseoutController::class, 'show'])->name('seasons.closeout');
        Route::put('/seasons/{season}/closeout', [SeasonCloseoutController::class, 'update'])->name('seasons.closeout.update');
        Route::put('/settings/account/profile', [AccountSettingController::class, 'updateProfile'])->name('settings.account.profile');
        Route::get('/settings/portability/export', [AccountPortabilityController::class, 'export'])->name('portability.export');
        Route::post('/settings/portability/preview', [AccountPortabilityController::class, 'previewReplacement'])->name('portability.preview');
        Route::post('/settings/portability/restore', [AccountPortabilityController::class, 'restoreReplacement'])->name('portability.restore');
        Route::get('/settings/portability/safety/{name}', [AccountPortabilityController::class, 'safety'])->name('portability.safety');
        Route::get('/restore/welcome', [AccountPortabilityController::class, 'welcome'])->name('portability.welcome');

        Route::get('/season-introduction', [SeasonIntroductionController::class, 'show'])
            ->name('seasons.introduction');
        Route::post('/seasons/{season}/introduction', [SeasonIntroductionController::class, 'acknowledge'])
            ->name('seasons.introduction.acknowledge');
        Route::post('/seasons/start', [SeasonCycleController::class, 'start'])->name('seasons.start');
        Route::put('/seasons/hold', [SeasonCycleController::class, 'hold'])->name('seasons.hold');
        Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::post('/tasks/{task}/focus-sessions', [TaskFocusSessionController::class, 'store'])->name('tasks.focus-sessions.store');
        Route::get('/focus-task-options', [TaskFocusSessionController::class, 'taskOptions'])->name('focus-task-options');
        Route::post('/tasks/{task}/focus-sessions/switch', [TaskFocusSessionController::class, 'switchToTask'])->name('tasks.focus-sessions.switch');
        Route::post('/tasks/{task}/focus-sessions/manual', [TaskFocusSessionController::class, 'storeManual'])->name('tasks.focus-sessions.manual.store');
        Route::post('/task-focus-sessions/{session}/pause', [TaskFocusSessionController::class, 'pause'])->name('task-focus-sessions.pause');
        Route::post('/task-focus-sessions/{session}/resume', [TaskFocusSessionController::class, 'resume'])->name('task-focus-sessions.resume');
        Route::post('/task-focus-sessions/{session}/stop', [TaskFocusSessionController::class, 'stop'])->name('task-focus-sessions.stop');
        Route::put('/task-focus-sessions/{session}', [TaskFocusSessionController::class, 'update'])->name('task-focus-sessions.update');
        Route::delete('/task-focus-sessions/{session}', [TaskFocusSessionController::class, 'destroy'])->name('task-focus-sessions.destroy');
        Route::post('/task-folders', [TaskFolderController::class, 'store'])->name('task-folders.store');
        Route::put('/task-folders/order', TaskFolderOrderController::class)->name('task-folders.order');
        Route::put('/task-folders/{folder}', [TaskFolderController::class, 'update'])->name('task-folders.update');
        Route::post('/task-folders/{folder}/archive', [TaskFolderController::class, 'archive'])->name('task-folders.archive');
        Route::post('/task-folders/{folder}/reactivate', [TaskFolderController::class, 'reactivate'])->name('task-folders.reactivate');
        Route::delete('/task-folders/{folder}', [TaskFolderController::class, 'destroy'])->name('task-folders.destroy');
        Route::post('/task-projects', [TaskProjectController::class, 'store'])->name('task-projects.store');
        Route::put('/task-projects/order', TaskProjectOrderController::class)->name('task-projects.order');
        Route::put('/task-projects/{project}/move', TaskProjectMovementController::class)->name('task-projects.move');
        Route::put('/task-projects/{project}', [TaskProjectController::class, 'update'])->name('task-projects.update');
        Route::post('/task-projects/{project}/archive', [TaskProjectController::class, 'archive'])->name('task-projects.archive');
        Route::post('/task-projects/{project}/reactivate', [TaskProjectController::class, 'reactivate'])->name('task-projects.reactivate');
        Route::delete('/task-projects/{project}', [TaskProjectController::class, 'destroy'])->name('task-projects.destroy');
        Route::put('/tasks/order', TaskOrderController::class)->name('tasks.order');
        Route::put('/tasks/{task}/move', TaskMovementController::class)->name('tasks.move');
        Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
        Route::post('/tasks/{task}/completion', [TaskCompletionController::class, 'store'])->name('tasks.complete');
        Route::delete('/tasks/{task}/completion', [TaskCompletionController::class, 'destroy'])->name('tasks.uncomplete');
        Route::put('/tasks/{task}/subtasks/{subtask}', [SubtaskCompletionController::class, 'update'])->name('subtasks.update');
        Route::delete('/tasks/{task}/future', StopTaskSeriesController::class)->name('tasks.stop-series');
        Route::post('/habits', [HabitController::class, 'store'])->name('habits.store');
        Route::put('/habits/{habit}', [HabitController::class, 'update'])->name('habits.update');
        Route::post('/habits/{habit}/archive', ArchiveHabitController::class)->name('habits.archive');
        Route::delete('/habits/{habit}', [HabitController::class, 'destroy'])->name('habits.destroy');
        Route::post('/habits/{habit}/occurrences/{date}/toggle', [HabitOccurrenceController::class, 'toggle'])
            ->where('date', '\\d{4}-\\d{2}-\\d{2}')
            ->name('habits.occurrences.toggle');
        Route::put('/habits/{habit}/occurrences/{date}/numeric', [HabitOccurrenceController::class, 'numeric'])
            ->where('date', '\\d{4}-\\d{2}-\\d{2}')
            ->name('habits.occurrences.numeric');
        Route::post('/habits/{habit}/occurrences/{date}/skip', [HabitOccurrenceController::class, 'skip'])
            ->where('date', '\\d{4}-\\d{2}-\\d{2}')
            ->name('habits.occurrences.skip');
        Route::delete('/habits/{habit}/occurrences/{date}', [HabitOccurrenceController::class, 'clear'])
            ->where('date', '\\d{4}-\\d{2}-\\d{2}')
            ->name('habits.occurrences.clear');
        Route::put('/today/settings', [TodaySettingController::class, 'update'])->name('today.settings.update');
        Route::put('/settings/general', [GeneralSettingController::class, 'update'])->name('settings.general.update');
        Route::put('/habits/settings/calendar-labels', [HabitSettingController::class, 'update'])->name('habits.settings.update');
        Route::put('/diary/entries/{date}', [DiaryController::class, 'update'])
            ->where('date', '\\d{4}-\\d{2}-\\d{2}')
            ->name('diary.entries.update');
        Route::put('/diary/settings/languages', [DiarySettingController::class, 'update'])->name('diary.settings.update');
        Route::post('/constitution/laws', [LawController::class, 'store'])->name('laws.store');
        Route::put('/constitution/laws/{law}', [LawController::class, 'update'])->name('laws.update');
        Route::post('/constitution/laws/{law}/archive', ArchiveLawController::class)->name('laws.archive');
        Route::delete('/constitution/laws/{law}', [LawController::class, 'destroy'])->name('laws.destroy');
        Route::post('/constitution/laws/{law}/violations', [ViolationController::class, 'store'])->name('violations.store');
        Route::put('/constitution/violations/{violation}', [ViolationController::class, 'update'])->name('violations.update');
        Route::delete('/constitution/violations/{violation}', [ViolationController::class, 'destroy'])->name('violations.destroy');
        Route::post('/money/accounts', [MoneyAccountController::class, 'store'])->name('money.accounts.store');
        Route::put('/money/accounts/{account}', [MoneyAccountController::class, 'update'])->name('money.accounts.update');
        Route::post('/money/accounts/{account}/archive', [MoneyAccountController::class, 'archive'])->name('money.accounts.archive');
        Route::post('/money/accounts/{account}/reactivate', [MoneyAccountController::class, 'reactivate'])->name('money.accounts.reactivate');
        Route::delete('/money/accounts/{account}', [MoneyAccountController::class, 'destroy'])->name('money.accounts.destroy');
        Route::post('/money/transactions', [MoneyTransactionController::class, 'store'])->name('money.transactions.store');
        Route::put('/money/transactions/{transaction}', [MoneyTransactionController::class, 'update'])->name('money.transactions.update');
        Route::delete('/money/transactions/{transaction}', [MoneyTransactionController::class, 'destroy'])->name('money.transactions.destroy');
        Route::post('/money/debts', [MoneyDebtController::class, 'store'])->name('money.debts.store');
        Route::delete('/money/debts/{debt}', [MoneyDebtController::class, 'destroy'])->name('money.debts.destroy');
        Route::post('/money/debts/{debt}/repayments', [MoneyDebtRepaymentController::class, 'store'])->name('money.debts.repayments.store');
        Route::post('/money/debts/{debt}/forgive', MoneyDebtForgivenessController::class)->name('money.debts.forgive');
        Route::delete('/money/debt-settlements/{settlement}', [MoneyDebtRepaymentController::class, 'destroy'])->name('money.debt-settlements.destroy');
        Route::post('/money/subscriptions', [MoneySubscriptionController::class, 'store'])->name('money.subscriptions.store');
        Route::put('/money/subscriptions/{subscription}', [MoneySubscriptionController::class, 'update'])->name('money.subscriptions.update');
        Route::post('/money/subscriptions/{subscription}/pause', [MoneySubscriptionController::class, 'pause'])->name('money.subscriptions.pause');
        Route::post('/money/subscriptions/{subscription}/resume', [MoneySubscriptionController::class, 'resume'])->name('money.subscriptions.resume');
        Route::post('/money/subscriptions/{subscription}/end', [MoneySubscriptionController::class, 'end'])->name('money.subscriptions.end');
        Route::delete('/money/subscriptions/{subscription}', [MoneySubscriptionController::class, 'destroy'])->name('money.subscriptions.destroy');
        Route::post('/money/subscription-occurrences/{occurrence}/pay', [MoneySubscriptionOccurrenceController::class, 'pay'])->name('money.subscription-occurrences.pay');
        Route::post('/money/subscription-occurrences/{occurrence}/skip', [MoneySubscriptionOccurrenceController::class, 'skip'])->name('money.subscription-occurrences.skip');
        Route::post('/money/categories', [MoneyCategoryController::class, 'store'])->name('money.categories.store');
        Route::put('/money/categories/{category}', [MoneyCategoryController::class, 'update'])->name('money.categories.update');
        Route::post('/money/categories/{category}/archive', [MoneyCategoryController::class, 'archive'])->name('money.categories.archive');
        Route::post('/money/categories/{category}/reactivate', [MoneyCategoryController::class, 'reactivate'])->name('money.categories.reactivate');
        Route::delete('/money/categories/{category}', [MoneyCategoryController::class, 'destroy'])->name('money.categories.destroy');
        Route::post('/money/merchants', [MoneyMerchantController::class, 'store'])->name('money.merchants.store');
        Route::put('/money/merchants/{merchant}', [MoneyMerchantController::class, 'update'])->name('money.merchants.update');
        Route::post('/money/merchants/{merchant}/archive', [MoneyMerchantController::class, 'archive'])->name('money.merchants.archive');
        Route::post('/money/merchants/{merchant}/reactivate', [MoneyMerchantController::class, 'reactivate'])->name('money.merchants.reactivate');
        Route::delete('/money/merchants/{merchant}', [MoneyMerchantController::class, 'destroy'])->name('money.merchants.destroy');
        Route::post('/money/tags', [MoneyTagController::class, 'store'])->name('money.tags.store');
        Route::put('/money/tags/{tag}', [MoneyTagController::class, 'update'])->name('money.tags.update');
        Route::post('/money/tags/{tag}/archive', [MoneyTagController::class, 'archive'])->name('money.tags.archive');
        Route::post('/money/tags/{tag}/reactivate', [MoneyTagController::class, 'reactivate'])->name('money.tags.reactivate');
        Route::delete('/money/tags/{tag}', [MoneyTagController::class, 'destroy'])->name('money.tags.destroy');
        Route::post('/money/subcategories', [MoneySubcategoryController::class, 'store'])->name('money.subcategories.store');
        Route::post('/money/presets/install', [MoneyPresetController::class, 'store'])->name('money.presets.install');
        Route::put('/money/subcategories/{subcategory}', [MoneySubcategoryController::class, 'update'])->name('money.subcategories.update');
        Route::post('/money/subcategories/{subcategory}/archive', [MoneySubcategoryController::class, 'archive'])->name('money.subcategories.archive');
        Route::post('/money/subcategories/{subcategory}/reactivate', [MoneySubcategoryController::class, 'reactivate'])->name('money.subcategories.reactivate');
        Route::delete('/money/subcategories/{subcategory}', [MoneySubcategoryController::class, 'destroy'])->name('money.subcategories.destroy');
        Route::scopeBindings()->group(function (): void {
            Route::post('/seasons/{season}/objectives', [ObjectiveController::class, 'store'])->name('objectives.store');
            Route::put('/seasons/{season}/objectives/{objective}', [ObjectiveController::class, 'update'])->name('objectives.update');
            Route::delete('/seasons/{season}/objectives/{objective}', [ObjectiveController::class, 'destroy'])->name('objectives.destroy');
            Route::post('/seasons/{season}/objectives/{objective}/toggle', ObjectiveCompletionController::class)->name('objectives.toggle');
        });
        Route::post('/diary/people', [PersonController::class, 'store'])->name('diary.people.store');
        Route::put('/diary/people/{person}', [PersonController::class, 'update'])->name('diary.people.update');
        Route::post('/diary/people/{person}/archive', [PersonController::class, 'archive'])->name('diary.people.archive');
        Route::delete('/diary/people/{person}', [PersonController::class, 'destroy'])->name('diary.people.destroy');
    });
});
