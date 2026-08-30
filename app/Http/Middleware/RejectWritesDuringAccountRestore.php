<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RejectWritesDuringAccountRestore
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || $request->routeIs('portability.restore', 'onboarding.restore')) {
            return $next($request);
        }

        $lock = Cache::lock("achelife-account-write:{$user->id}", 300);

        if (! $lock->get()) {
            abort(423, 'This account is temporarily locked while a restore is in progress.');
        }

        try {
            return $next($request);
        } finally {
            $lock->release();
        }
    }
}
