<?php

namespace App\Http\Controllers;

use App\Services\Calendar\UserCalendar;
use App\Support\Today\TodayViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function __invoke(Request $request, TodayViewDataFactory $viewDataFactory, UserCalendar $calendar): Response
    {
        return Inertia::render('Home', $viewDataFactory->make($request->user(), $calendar->today($request->user())));
    }
}
