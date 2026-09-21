<?php

namespace App\Services\Portability;

use App\Exceptions\InvalidAccountArchive;
use Carbon\CarbonImmutable;
use Throwable;

class ArchiveTaskFocusValidator
{
    /** @var array<int, array<string, mixed>> */
    private array $sessions = [];

    /** @var array<int, int> */
    private array $durationTotals = [];

    /** @var array<int, CarbonImmutable> */
    private array $latestIntervalEnds = [];

    /** @var array<int, int> */
    private array $intervalCounts = [];

    private int $activeSessions = 0;

    /** @var array<int, true> */
    private array $openTaskIds = [];

    private int $formatVersion = 5;

    public function useFormatVersion(int $formatVersion): void
    {
        $this->formatVersion = $formatVersion;
    }

    /** @param array<string, mixed> $row */
    public function validate(string $table, array $row): void
    {
        if ($table === 'task_focus_sessions') {
            $this->validateSession($row);
        } elseif ($table === 'task_focus_intervals') {
            $this->validateInterval($row);
        }
    }

    public function complete(): void
    {
        foreach ($this->sessions as $id => $session) {
            if ((int) $session['accumulated_seconds'] !== ($this->durationTotals[$id] ?? 0)) {
                throw new InvalidAccountArchive('A Focus Session duration does not match its intervals.');
            }

            if (($this->intervalCounts[$id] ?? 0) === 0) {
                throw new InvalidAccountArchive('A Focus Session must contain at least one interval.');
            }
        }
    }

    public function reset(): void
    {
        $this->sessions = [];
        $this->durationTotals = [];
        $this->latestIntervalEnds = [];
        $this->intervalCounts = [];
        $this->activeSessions = 0;
        $this->openTaskIds = [];
    }

    /** @param array<string, mixed> $row */
    private function validateSession(array $row): void
    {
        $state = (string) $row['state'];
        $source = (string) $row['source'];
        $startedAt = $this->timestamp((string) $row['started_at']);
        $endedAt = $row['ended_at'] === null ? null : $this->timestamp((string) $row['ended_at']);
        $active = $row['active_marker'] !== null;

        if (! in_array($state, ['paused', 'completed'], true)
            || ! in_array($source, ['timer', 'manual'], true)
            || (int) $row['accumulated_seconds'] < 0
            || ($source === 'manual' && $state !== 'completed')
            || ($state === 'paused' && ($endedAt !== null || ! $active))
            || ($state === 'completed' && ($endedAt === null || $active))
            || ($endedAt !== null && $endedAt->isBefore($startedAt))) {
            throw new InvalidAccountArchive('A Focus Session has inconsistent state.');
        }

        if ($active) {
            $this->activeSessions++;
            $taskId = (int) $row['task_id'];

            if ((int) $row['active_marker'] !== 1
                || ($this->formatVersion <= 5 && $this->activeSessions > 1)
                || isset($this->openTaskIds[$taskId])) {
                throw new InvalidAccountArchive('An archive contains conflicting open Focus Sessions.');
            }

            $this->openTaskIds[$taskId] = true;
        }

        $id = (int) $row['id'];
        $this->sessions[$id] = $row;
        $this->durationTotals[$id] = 0;
        $this->intervalCounts[$id] = 0;
    }

    /** @param array<string, mixed> $row */
    private function validateInterval(array $row): void
    {
        $sessionId = (int) $row['task_focus_session_id'];
        $session = $this->sessions[$sessionId];
        $startedAt = $this->timestamp((string) $row['started_at']);
        $endedAt = $row['ended_at'] === null ? null : $this->timestamp((string) $row['ended_at']);
        $sessionStartedAt = $this->timestamp((string) $session['started_at']);
        $sessionEndedAt = $session['ended_at'] === null ? null : $this->timestamp((string) $session['ended_at']);

        if ($endedAt === null
            || $startedAt->isBefore($sessionStartedAt)
            || $endedAt->isBefore($startedAt)
            || ($sessionEndedAt !== null && $endedAt->isAfter($sessionEndedAt))
            || (isset($this->latestIntervalEnds[$sessionId]) && $startedAt->isBefore($this->latestIntervalEnds[$sessionId]))) {
            throw new InvalidAccountArchive('A Focus interval is invalid or overlaps another interval.');
        }

        $this->durationTotals[$sessionId] += (int) $startedAt->diffInSeconds($endedAt);
        $this->intervalCounts[$sessionId]++;
        $this->latestIntervalEnds[$sessionId] = $endedAt;
    }

    private function timestamp(string $value): CarbonImmutable
    {
        try {
            $timestamp = CarbonImmutable::createFromFormat('!Y-m-d H:i:s', $value, 'UTC');
        } catch (Throwable) {
            throw new InvalidAccountArchive('A Focus timestamp is invalid.');
        }

        if ($timestamp === false || $timestamp->format('Y-m-d H:i:s') !== $value) {
            throw new InvalidAccountArchive('A Focus timestamp is invalid.');
        }

        return $timestamp;
    }
}
