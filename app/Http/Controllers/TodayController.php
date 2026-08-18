<?php

namespace App\Http\Controllers;

use App\Support\Today\TodayViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function __invoke(Request $request, TodayViewDataFactory $viewDataFactory): Response
    {
        return Inertia::render('Home', $viewDataFactory->make($request->user(), CarbonImmutable::today()));
    }
}
