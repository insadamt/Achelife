<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RememberInertiaPageUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->isSuccessfulInertiaPageVisit($request, $response)) {
            $request->session()->setPreviousUrl($request->fullUrl());

            if (method_exists($request->session(), 'setPreviousRoute')) {
                $request->session()->setPreviousRoute($request->route()?->getName());
            }
        }

        return $response;
    }

    private function isSuccessfulInertiaPageVisit(Request $request, Response $response): bool
    {
        return $request->isMethod('GET')
            && $request->header('X-Inertia') === 'true'
            && ! $request->prefetch()
            && ! $request->isPrecognitive()
            && $response->isSuccessful();
    }
}
