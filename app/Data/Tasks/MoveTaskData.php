<?php

namespace App\Data\Tasks;

readonly class MoveTaskData
{
    public function __construct(public ?int $projectId, public int $position) {}
}
