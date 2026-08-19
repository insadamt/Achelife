<?php

namespace App\Http\Controllers;

use App\Data\Seasons\SeasonRank;
use App\Services\Seasons\SeasonRankCalculator;
use Inertia\Inertia;
use Inertia\Response;

class SeasonRankGuideController extends Controller
{
    public function __invoke(SeasonRankCalculator $rankCalculator): Response
    {
        return Inertia::render('seasons/RankGuide', [
            'ranks' => array_map(
                fn (SeasonRank $rank): array => $rank->toArray(),
                $rankCalculator->progression(),
            ),
        ]);
    }
}
