<?php

namespace App\Data\Tasks;

readonly class MoveTaskProjectData
{
    public function __construct(public ?int $folderId, public int $position) {}
}
