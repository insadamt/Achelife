<?php

namespace App\Actions\Tasks;

use App\Models\User;
use App\Services\Tasks\TaskSiblingOrder;
use Illuminate\Support\Facades\DB;

class ReorderTaskFolders
{
    public function __construct(private readonly TaskSiblingOrder $siblingOrder) {}

    /** @param list<int> $orderedIds */
    public function execute(User $user, array $orderedIds): void
    {
        DB::transaction(function () use ($user, $orderedIds): void {
            $folders = $user->taskFolders()
                ->lockForUpdate()
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            $this->siblingOrder->applyExactOrder($folders, $orderedIds, 'folder_ids');
        });
    }
}
