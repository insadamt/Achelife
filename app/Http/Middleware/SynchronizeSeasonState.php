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
        $cycle = $this->resolveUserSeasonCycle->execute($request->user());
        $currentSeason = $cycle->activeSeason;

        if ($currentSeason !== null && $currentSeason->introduced_at === null) {
            $completedSeason = $request->user()->seasons()
                ->where('season_number', $currentSeason->season_number - 1)
                ->whereNotNull('finalized_at')
                ->whereNull('recap_seen_at')
                ->first();

            if ($completedSeason !== null) {
                $request->session()->put('season_introduction_redirect', $request->fullUrl());

                return new RedirectResponse(route('seasons.closeout', $completedSeason, false));
            }
        }

        if ($currentSeason !== null && $currentSeason->introduced_at === null) {
            $request->session()->put('season_introduction_redirect', $request->fullUrl());

            return new RedirectResponse(route('seasons.introduction', absolute: false));
        }

        return $next($request);
    }
}
