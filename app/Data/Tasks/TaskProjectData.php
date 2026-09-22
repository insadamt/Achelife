<?php

namespace App\Data\Tasks;

readonly class TaskProjectData
{
    public function __construct(public string $name, public ?int $folderId, public ?string $color = null) {}
}
