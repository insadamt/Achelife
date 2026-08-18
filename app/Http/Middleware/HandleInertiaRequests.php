<?php

namespace App\Http\Middleware;

use App\Support\Progress\ProgressPanelViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(private readonly ProgressPanelViewDataFactory $progressPanelViewDataFactory) {}

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user === null ? null : [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ],
            'flash' => [
                'constitutionPenalty' => $request->session()->get('constitutionPenalty'),
            ],
            'progressPanel' => fn () => $user === null
                ? null
                : $this->progressPanelViewDataFactory->make($user, CarbonImmutable::today()),
        ];
    }
}
