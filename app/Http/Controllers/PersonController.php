<?php

namespace App\Http\Controllers;

use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PersonController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePerson($request);
        $person = $request->user()->people()->create($validated);

        return response()->json(['person' => $this->personData($person)], 201);
    }

    public function update(Request $request, Person $person): RedirectResponse
    {
        Gate::authorize('update', $person);
        $person->update($this->validatePerson($request));

        return back();
    }

    public function archive(Request $request, Person $person): RedirectResponse
    {
        Gate::authorize('update', $person);

        if (! $person->mentions()->exists()) {
            throw ValidationException::withMessages(['person' => 'Delete an unmentioned Person instead of archiving them.']);
        }

        $person->update(['archived_at' => now()]);

        return back();
    }

    public function destroy(Request $request, Person $person): RedirectResponse
    {
        Gate::authorize('delete', $person);

        if ($person->mentions()->exists()) {
            throw ValidationException::withMessages(['person' => 'Mentioned People cannot be deleted. Archive this Person instead.']);
        }

        $person->delete();

        return back();
    }

    /** @return array<string, string|null> */
    private function validatePerson(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'nickname' => ['nullable', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    /** @return array<string, mixed> */
    private function personData(Person $person): array
    {
        return [
            'id' => $person->id,
            'name' => $person->name,
            'nickname' => $person->nickname,
            'note' => $person->note,
            'archived' => false,
            'mentionCount' => 0,
            'recentEntries' => [],
        ];
    }
}
