<?php

namespace App\Http\Middleware;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SynchronizeSeasonState
{
    public function __construct(private readonly ResolveUserSeasonCycle $resolveUserSeasonCycle) {}

    public function handle(Request $request, Closure $next): Response
    {
        $currentSeason = $this->resolveUserSeasonCycle->execute($request->user())->activeSeason;

        if ($currentSeason !== null && $currentSeason->introduced_at === null) {
            $request->session()->put('season_introduction_redirect', $request->fullUrl());

            return new RedirectResponse(route('seasons.introduction', absolute: false));
        }

        return $next($request);
    }
}
