<?php

namespace App\Http\Middleware;

use App\Services\Calendar\UserCalendar;
use App\Models\AppearanceSetting;
use App\Support\Progress\ProgressPanelViewDataFactory;
use App\Support\Tasks\TaskFocusSessionViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        private readonly ProgressPanelViewDataFactory $progressPanelViewDataFactory,
        private readonly UserCalendar $calendar,
        private readonly TaskFocusSessionViewDataFactory $focusSessionViewDataFactory,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $openFocusSessions = null;
        $appearance = $user === null ? null : AppearanceSetting::query()->find($user->id);
        $loadOpenFocusSessions = function () use ($user, &$openFocusSessions): array {
            return $openFocusSessions ??= ($user === null ? [] : $this->focusSessionViewDataFactory->openForUser($user));
        };

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
            'appearance' => [
                'surfaceStyle' => $appearance?->surface_style ?? 'glass',
                'lightAccent' => $appearance?->light_accent ?? '#D7E66B',
                'darkAccent' => $appearance?->dark_accent ?? '#D7E66B',
                'backgroundUrl' => $appearance?->background_hash === null
                    ? null
                    : route('appearance.background', ['hash' => $appearance->background_hash]),
            ],
            'progressPanel' => fn () => $user === null || $user->onboarding_completed_at === null
                ? null
                : $this->progressPanelViewDataFactory->make($user, $this->calendar->today($user)),
            'activeFocusSession' => fn () => $loadOpenFocusSessions()[0] ?? null,
            'openFocusSessions' => $loadOpenFocusSessions,
        ];
    }
}
