<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingIsComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->onboarding_completed_at === null) {
            return new RedirectResponse(route('onboarding.show', absolute: false));
        }

        return $next($request);
    }
}
