<?php

namespace App\Models;

use App\Enums\LawSeverity;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable([
    'user_id',
    'law_id',
    'season_id',
    'violation_date',
    'severity_snapshot',
    'base_penalty_snapshot',
    'sequence_number',
    'penalty_sp',
])]
class Violation extends Model
{
    protected static function booted(): void
    {
        static::saving(function (Violation $violation): void {
            $law = Law::query()->findOrFail($violation->law_id);
            $season = Season::query()->findOrFail($violation->season_id);
            $expectedBasePenalty = $violation->severity_snapshot->basePenalty();

            if ($law->user_id !== $violation->user_id || $season->user_id !== $violation->user_id) {
                throw new LogicException('A Violation must share ownership with its Law and Season.');
            }

            if ($violation->violation_date->isBefore($season->start_date) || $violation->violation_date->isAfter($season->end_date)) {
                throw new LogicException('A Violation date must be inside its attributed Season.');
            }

            if ($violation->base_penalty_snapshot !== $expectedBasePenalty) {
                throw new LogicException('A Violation base penalty must match its severity snapshot.');
            }

            if ($violation->sequence_number < 1 || $violation->penalty_sp !== $expectedBasePenalty * $violation->sequence_number) {
                throw new LogicException('A Violation sequence and final penalty must be exact.');
            }
        });
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Law, $this> */
    public function law(): BelongsTo
    {
        return $this->belongsTo(Law::class);
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'violation_date' => 'immutable_date',
            'severity_snapshot' => LawSeverity::class,
            'base_penalty_snapshot' => 'integer',
            'sequence_number' => 'integer',
            'penalty_sp' => 'integer',
        ];
    }
}
