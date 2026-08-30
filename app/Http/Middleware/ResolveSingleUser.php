<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveSingleUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            return $next($request);
        }

        $users = User::query()->limit(2)->get();

        abort_if(
            $users->count() > 1,
            409,
            'Achelife single-user mode cannot choose between multiple existing profiles.',
        );

        if ($users->count() === 1) {
            Auth::setUser($users->first());
        }

        return $next($request);
    }
}
