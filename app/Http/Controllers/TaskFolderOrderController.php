<?php

namespace App\Http\Controllers;

use App\Actions\Tasks\ReorderTaskFolders;
use App\Http\Requests\ReorderTaskFoldersRequest;
use Illuminate\Http\RedirectResponse;

class TaskFolderOrderController extends Controller
{
    public function __invoke(ReorderTaskFoldersRequest $request, ReorderTaskFolders $reorder): RedirectResponse
    {
        $reorder->execute($request->user(), array_map('intval', $request->validated('folder_ids')));

        return back();
    }
}
