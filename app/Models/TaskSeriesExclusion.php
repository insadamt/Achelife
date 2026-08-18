<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['task_series_id', 'occurrence_date'])]
class TaskSeriesExclusion extends Model
{
    /** @return BelongsTo<TaskSeries, $this> */
    public function series(): BelongsTo
    {
        return $this->belongsTo(TaskSeries::class, 'task_series_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['occurrence_date' => 'immutable_date'];
    }
}
