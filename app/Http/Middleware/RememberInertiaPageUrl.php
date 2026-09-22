<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RememberInertiaPageUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        $this->rememberMutationOrigin($request);

        $response = $next($request);

        if ($this->isSuccessfulInertiaPageVisit($request, $response)) {
            $request->session()->setPreviousUrl($request->fullUrl());

            if (method_exists($request->session(), 'setPreviousRoute')) {
                $request->session()->setPreviousRoute($request->route()?->getName());
            }
        }

        return $response;
    }

    private function rememberMutationOrigin(Request $request): void
    {
        if (! $this->isInertiaMutation($request)) {
            return;
        }

        $origin = $this->validCurrentPageUrl($request);

        if ($origin !== null) {
            $request->session()->setPreviousUrl($origin);
        }
    }

    private function isSuccessfulInertiaPageVisit(Request $request, Response $response): bool
    {
        return $request->isMethod('GET')
            && $request->header('X-Inertia') === 'true'
            && ! $request->prefetch()
            && ! $request->isPrecognitive()
            && $response->isSuccessful();
    }

    private function isInertiaMutation(Request $request): bool
    {
        return ! $request->isMethod('GET')
            && $request->header('X-Inertia') === 'true';
    }

    private function validCurrentPageUrl(Request $request): ?string
    {
        $url = $request->header('X-Achelife-Current-Url');

        if (! is_string($url) || ! str_starts_with($url, '/') || str_starts_with($url, '//')) {
            return null;
        }

        $parts = parse_url($url);

        if ($parts === false || isset($parts['scheme'], $parts['host'], $parts['user'], $parts['pass'], $parts['port'])) {
            return null;
        }

        return $url;
    }
}
