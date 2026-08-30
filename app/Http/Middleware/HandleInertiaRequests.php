<?php

namespace App\Http\Middleware;

use App\Services\Calendar\UserCalendar;
use App\Support\Progress\ProgressPanelViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        private readonly ProgressPanelViewDataFactory $progressPanelViewDataFactory,
        private readonly UserCalendar $calendar,
    ) {}

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
                    'timezone' => $user->timezone,
                ],
            ],
            'flash' => [
                'constitutionViolation' => $request->session()->get('constitutionViolation'),
            ],
            'progressPanel' => fn () => $user === null || $user->onboarding_completed_at === null
                ? null
                : $this->progressPanelViewDataFactory->make($user, $this->calendar->today($user)),
        ];
    }
}
