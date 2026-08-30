<?php

namespace App\Http\Middleware;

use App\Actions\Money\SynchronizeMoneySubscriptions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SynchronizeMoneySubscriptionState
{
    public function __construct(private readonly SynchronizeMoneySubscriptions $synchronize) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() !== null && ($request->is('money') || $request->is('money/*'))) {
            $this->synchronize->execute($request->user());
        }

        return $next($request);
    }
}
