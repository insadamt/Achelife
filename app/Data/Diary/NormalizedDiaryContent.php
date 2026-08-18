<?php

namespace App\Data\Diary;

class NormalizedDiaryContent
{
    /**
     * @param  list<array{type: string, text?: string, personId?: int, label?: string}>  $nodes
     * @param  list<array{person_id: int, node_index: int, display_text: string}>  $mentions
     */
    public function __construct(
        public readonly array $nodes,
        public readonly string $plainText,
        public readonly int $characterCount,
        public readonly array $mentions,
    ) {}
}
