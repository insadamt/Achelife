<?php

namespace App\Services\Portability;

use App\Exceptions\InvalidAccountArchive;
use App\Support\Settings\AppearanceBackground;
use RuntimeException;

class ArchiveAppearanceValidator
{
    /** @var array<string, mixed>|null */
    private ?array $settings = null;

    /** @var array<int, string> */
    private array $chunks = [];

    public function __construct(private readonly AppearanceBackground $background) {}

    public function reset(): void
    {
        $this->settings = null;
        $this->chunks = [];
    }

    /** @param array<string, mixed> $row */
    public function validateRow(string $table, array $row): void
    {
        if ($table === 'appearance_settings') {
            $this->settings = $row;
            $this->validateSettings($row);
        }

        if ($table === 'appearance_background_chunks') {
            $this->validateChunk($row);
        }
    }

    public function complete(): void
    {
        if ($this->settings === null || $this->settings['background_hash'] === null) {
            if ($this->chunks !== []) {
                throw new InvalidAccountArchive('Appearance background data is missing its settings.');
            }

            return;
        }

        ksort($this->chunks);
        $bytes = '';
        $expectedSequence = 0;

        foreach ($this->chunks as $sequence => $chunk) {
            if ($sequence !== $expectedSequence++) {
                throw new InvalidAccountArchive('Appearance background chunks are incomplete.');
            }

            $bytes .= $chunk;
        }

        if (strlen($bytes) !== $this->settings['background_bytes']
            || ! hash_equals($this->settings['background_hash'], hash('sha256', $bytes))) {
            throw new InvalidAccountArchive('Appearance background data does not match its settings.');
        }

        try {
            $mime = $this->background->imageMime($bytes);
        } catch (RuntimeException) {
            throw new InvalidAccountArchive('Appearance background is not a supported image.');
        }

        if ($mime !== $this->settings['background_mime']) {
            throw new InvalidAccountArchive('Appearance background type does not match its settings.');
        }
    }

    /** @param array<string, mixed> $row */
    private function validateSettings(array $row): void
    {
        if (! in_array($row['surface_style'], ['normal', 'glass'], true)) {
            throw new InvalidAccountArchive('Appearance style is invalid.');
        }

        $hasBackground = $row['background_hash'] !== null;

        if ($hasBackground) {
            if (! in_array($row['background_mime'], ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], true)
                || ! is_string($row['background_hash'])
                || preg_match('/^[a-f0-9]{64}$/', $row['background_hash']) !== 1
                || ! is_int($row['background_bytes'])
                || $row['background_bytes'] < 1
                || $row['background_bytes'] > AppearanceBackground::MAX_BYTES) {
                throw new InvalidAccountArchive('Appearance background metadata is invalid.');
            }
        } elseif ($row['background_mime'] !== null || $row['background_bytes'] !== null) {
            throw new InvalidAccountArchive('Appearance background metadata is incomplete.');
        }
    }

    /** @param array<string, mixed> $row */
    private function validateChunk(array $row): void
    {
        $sequence = filter_var($row['sequence'], FILTER_VALIDATE_INT);
        $encoded = $row['base64_data'];

        if ($sequence === false || $sequence < 0 || $sequence > 15 || isset($this->chunks[$sequence])
            || ! is_string($encoded) || strlen($encoded) > 700000) {
            throw new InvalidAccountArchive('Appearance background chunk is invalid.');
        }

        $bytes = base64_decode($encoded, true);

        if ($bytes === false || $bytes === '' || strlen($bytes) > 512 * 1024) {
            throw new InvalidAccountArchive('Appearance background chunk cannot be decoded.');
        }

        $this->chunks[$sequence] = $bytes;
    }

}
