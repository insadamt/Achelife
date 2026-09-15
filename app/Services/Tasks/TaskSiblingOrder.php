<?php

namespace App\Services\Tasks;

use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class TaskSiblingOrder
{
    /** @param Collection<int, object{id: int, position: int}> $siblings
     * @param  list<int>  $orderedIds
     */
    public function applyExactOrder(Collection $siblings, array $orderedIds, string $field): void
    {
        $currentIds = $siblings->pluck('id')->map(fn ($id): int => (int) $id)->sort()->values()->all();
        $submittedIds = collect($orderedIds)->sort()->values()->all();

        if (count($orderedIds) !== count(array_unique($orderedIds)) || $currentIds !== $submittedIds) {
            throw ValidationException::withMessages([
                $field => 'The submitted order must contain every sibling exactly once.',
            ]);
        }

        $siblingsById = $siblings->keyBy('id');
        $this->applyOrder(collect(array_map(fn (int $id) => $siblingsById->get($id), $orderedIds)));
    }

    /** @param Collection<int, object{position: int}> $siblings */
    public function applyOrder(Collection $siblings): void
    {
        foreach ($siblings->values() as $position => $sibling) {
            if ($sibling->position !== $position) {
                $sibling->update(['position' => $position]);
            }
        }
    }

    public function ensurePositionIsBounded(int $position, int $siblingCount): void
    {
        if ($position < 0 || $position > $siblingCount) {
            throw ValidationException::withMessages([
                'position' => "The position must be between 0 and {$siblingCount}.",
            ]);
        }
    }
}
