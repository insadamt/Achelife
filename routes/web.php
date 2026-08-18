<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeasonIntroductionController;
use App\Http\Controllers\StopTaskSeriesController;
use App\Http\Controllers\SubtaskCompletionController;
use App\Http\Controllers\TaskCompletionController;
use App\Http\Controllers\TaskController;
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
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
