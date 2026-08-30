<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\CarbonImmutable;
use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SingleUserSetupController extends Controller
{
    public function create(): Response
    {
        abort_if(User::query()->exists(), 409, 'Achelife setup is already complete.');

        return Inertia::render('setup/Index');
    }

    public function store(Request $request): RedirectResponse
    {
        $attributes = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ]);
        $timezone = $this->resolvedTimezone($attributes['timezone'] ?? null);

        Cache::lock('achelife-single-user-setup', 10)->block(5, function () use ($attributes, $timezone): void {
            DB::transaction(function () use ($attributes, $timezone): void {
                abort_if(User::query()->exists(), 409, 'Achelife setup is already complete.');

                User::query()->create([
                    'name' => $attributes['name'],
                    'email' => 'owner@achelife.invalid',
                    'password' => Str::random(64),
                    'timezone' => $timezone,
                    'calendar_started_on' => CarbonImmutable::now('UTC')->setTimezone($timezone)->toDateString(),
                    'onboarding_step' => 'path',
                    'onboarding_completed_at' => null,
                ]);
            });
        });

        return redirect()->route('onboarding.show');
    }

    private function resolvedTimezone(mixed $requestedTimezone): string
    {
        if (! is_string($requestedTimezone)) {
            return 'UTC';
        }

        return in_array($requestedTimezone, [...DateTimeZone::listIdentifiers(), 'UTC'], true)
            ? $requestedTimezone
            : 'UTC';
    }
}
