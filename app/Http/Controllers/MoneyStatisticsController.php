<?php

namespace App\Http\Controllers;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Services\Money\MoneyStatistics;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyStatisticsController extends Controller
{
    public function __invoke(Request $request, ResolveUserSeasonCycle $resolveCycle, MoneyStatistics $statistics): Response
    {
        $validated = $request->validate([
            'statistics_period' => ['sometimes', 'in:season,month,year,all'],
            'statistics_value' => ['sometimes', 'nullable', 'string', 'max:10', 'regex:/^(?:\d{1,6}|\d{4}(?:-\d{2})?)$/'],
            'currency' => ['sometimes', 'nullable', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'account' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);
        $user = $request->user();

        return Inertia::render('money/Statistics', [
            'statistics' => fn (): array => $statistics->summarize(
                $user,
                $resolveCycle->execute($user),
                $validated['statistics_period'] ?? 'month',
                $validated['statistics_value'] ?? null,
                $validated['currency'] ?? null,
                isset($validated['account']) ? (int) $validated['account'] : null,
            ),
        ]);
    }
}
