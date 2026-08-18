<?php

namespace App\Services\Diary;

use App\Data\Diary\NormalizedDiaryContent;
use App\Models\Person;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class DiaryContentNormalizer
{
    /** @param array<int, mixed> $content */
    public function normalize(User $user, array $content): NormalizedDiaryContent
    {
        $personIds = collect($content)
            ->filter(fn (mixed $node): bool => is_array($node) && ($node['type'] ?? null) === 'mention')
            ->pluck('personId')
            ->filter(fn (mixed $id): bool => is_int($id) || ctype_digit((string) $id))
            ->map(fn (mixed $id): int => (int) $id)
            ->unique();
        $people = $user->people()->whereIn('id', $personIds)->get()->keyBy('id');

        if ($people->count() !== $personIds->count()) {
            throw ValidationException::withMessages(['content' => 'A mention references an unavailable Person.']);
        }

        [$nodes, $plainText, $mentions] = $this->buildNormalizedNodes($content, $people);

        return new NormalizedDiaryContent($nodes, $plainText, mb_strlen(trim($plainText)), $mentions);
    }

    /**
     * @param  array<int, mixed>  $content
     * @param  Collection<int, Person>  $people
     * @return array{list<array{type: string, text?: string, personId?: int, label?: string}>, string, list<array{person_id: int, node_index: int, display_text: string}>}
     */
    private function buildNormalizedNodes(array $content, Collection $people): array
    {
        $nodes = [];
        $plainText = '';
        $mentions = [];

        foreach ($content as $node) {
            if (! is_array($node) || ! in_array($node['type'] ?? null, ['text', 'mention'], true)) {
                throw ValidationException::withMessages(['content' => 'Diary content contains an invalid node.']);
            }

            if ($node['type'] === 'text') {
                $text = (string) ($node['text'] ?? '');
                $nodes[] = ['type' => 'text', 'text' => $text];
                $plainText .= $text;

                continue;
            }

            $personId = (int) ($node['personId'] ?? 0);
            $person = $people->get($personId);
            $label = trim((string) ($node['label'] ?? $person?->name));

            if ($person === null || $label === '') {
                throw ValidationException::withMessages(['content' => 'Diary mentions require a valid Person and visible label.']);
            }

            $nodeIndex = count($nodes);
            $visibleText = '@'.$label;
            $nodes[] = ['type' => 'mention', 'personId' => $personId, 'label' => $label];
            $plainText .= $visibleText;
            $mentions[] = ['person_id' => $personId, 'node_index' => $nodeIndex, 'display_text' => $visibleText];
        }

        return [$nodes, $plainText, $mentions];
    }
}
