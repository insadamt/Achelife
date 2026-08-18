<?php

namespace App\Data\Tasks;

readonly class SubtaskData
{
    public function __construct(
        public ?int $id,
        public string $title,
    ) {}
}
