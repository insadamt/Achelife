<?php

namespace App\Http\Controllers;

use App\Actions\Constitution\CorrectViolationDate;
use App\Actions\Constitution\DeleteViolation;
use App\Actions\Constitution\RecordViolation;
use App\Http\Requests\StoreViolationRequest;
use App\Http\Requests\UpdateViolationRequest;
use App\Models\Law;
use App\Models\Violation;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ViolationController extends Controller
{
    public function store(StoreViolationRequest $request, Law $law, RecordViolation $recordViolation): RedirectResponse
    {
        Gate::authorize('view', $law);
        $violation = $recordViolation->execute(
            $request->user(),
            $law,
            $this->calendarDate($request->validated('date')),
        );

        return back()->with('constitutionViolation', [
            'id' => $violation->id,
            'lawName' => $law->name,
            'sequence' => $violation->sequence_number,
            'penalty' => $violation->penalty_sp,
        ]);
    }

    public function update(
        UpdateViolationRequest $request,
        Violation $violation,
        CorrectViolationDate $correctViolationDate,
    ): RedirectResponse {
        $correctViolationDate->execute(
            $request->user(),
            $violation,
            $this->calendarDate($request->validated('date')),
        );

        return back();
    }

    public function destroy(Request $request, Violation $violation, DeleteViolation $deleteViolation): RedirectResponse
    {
        Gate::authorize('delete', $violation);
        $deleteViolation->execute($request->user(), $violation);

        return back();
    }

    private function calendarDate(string $date): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $date);
    }
}
