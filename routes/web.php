<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeasonIntroductionController;
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
    });

    Route::get('/season-introduction', [SeasonIntroductionController::class, 'show'])
        ->name('seasons.introduction');
    Route::post('/seasons/{season}/introduction', [SeasonIntroductionController::class, 'acknowledge'])
        ->name('seasons.introduction.acknowledge');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
