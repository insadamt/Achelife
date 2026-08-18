<?php

use App\Http\Controllers\ArchiveHabitController;
use App\Http\Controllers\ArchiveLawController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ConstitutionController;
use App\Http\Controllers\DiaryController;
use App\Http\Controllers\DiarySettingController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\HabitOccurrenceController;
use App\Http\Controllers\HabitSettingController;
use App\Http\Controllers\LawController;
use App\Http\Controllers\MoneyAccountController;
use App\Http\Controllers\MoneyArchiveController;
use App\Http\Controllers\MoneyCategoryController;
use App\Http\Controllers\MoneyController;
use App\Http\Controllers\MoneyHistoryController;
use App\Http\Controllers\MoneySubcategoryController;
use App\Http\Controllers\MoneyTransactionController;
use App\Http\Controllers\ObjectiveCompletionController;
use App\Http\Controllers\ObjectiveController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeasonIntroductionController;
use App\Http\Controllers\StopTaskSeriesController;
use App\Http\Controllers\SubtaskCompletionController;
use App\Http\Controllers\TaskCompletionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ViolationController;
use App\Http\Middleware\SynchronizeSeasonState;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/home');

Route::middleware('guest')->group(function (): void {
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:5,1');

    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:5,1');
});

Route::middleware('auth')->group(function (): void {
    Route::middleware(SynchronizeSeasonState::class)->group(function (): void {
        Route::get('/home', fn () => Inertia::render('Home'))->name('home');
        Route::get('/seasons', SeasonController::class)->name('seasons.index');
        Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
        Route::get('/habits', [HabitController::class, 'index'])->name('habits.index');
        Route::get('/habits/archived', [HabitController::class, 'archived'])->name('habits.archived');
        Route::get('/diary', [DiaryController::class, 'index'])->name('diary.index');
        Route::get('/constitution', [ConstitutionController::class, 'index'])->name('constitution.index');
        Route::get('/constitution/archived', [ConstitutionController::class, 'archived'])->name('constitution.archived');
        Route::get('/money', [MoneyController::class, 'index'])->name('money.index');
        Route::get('/money/history', MoneyHistoryController::class)->name('money.history');
        Route::get('/money/accounts/archived', [MoneyArchiveController::class, 'accounts'])->name('money.accounts.archived');
        Route::get('/money/categories', [MoneyArchiveController::class, 'categories'])->name('money.categories.index');
        Route::get('/money/accounts/{account}', [MoneyAccountController::class, 'show'])->name('money.accounts.show');
    });

    Route::get('/season-introduction', [SeasonIntroductionController::class, 'show'])
        ->name('seasons.introduction');
    Route::post('/seasons/{season}/introduction', [SeasonIntroductionController::class, 'acknowledge'])
        ->name('seasons.introduction.acknowledge');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
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
    Route::post('/money/categories', [MoneyCategoryController::class, 'store'])->name('money.categories.store');
    Route::put('/money/categories/{category}', [MoneyCategoryController::class, 'update'])->name('money.categories.update');
    Route::post('/money/categories/{category}/archive', [MoneyCategoryController::class, 'archive'])->name('money.categories.archive');
    Route::post('/money/categories/{category}/reactivate', [MoneyCategoryController::class, 'reactivate'])->name('money.categories.reactivate');
    Route::delete('/money/categories/{category}', [MoneyCategoryController::class, 'destroy'])->name('money.categories.destroy');
    Route::post('/money/subcategories', [MoneySubcategoryController::class, 'store'])->name('money.subcategories.store');
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
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
