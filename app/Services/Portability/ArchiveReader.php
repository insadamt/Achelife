<?php

namespace App\Services\Portability;

use App\Exceptions\InvalidAccountArchive;
use Generator;
use JsonException;
use ZipArchive;

class ArchiveReader
{
    /** @return array<string, mixed> */
    public function readJson(string $archivePath, string $entryName): array
    {
        $zip = $this->open($archivePath);
        $stream = $zip->getStream($entryName);

        if ($stream === false) {
            $zip->close();
            throw new InvalidAccountArchive("{$entryName} cannot be read.");
        }

        try {
            $content = $this->readBoundedStream($stream, $entryName);
            $value = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidAccountArchive("{$entryName} contains malformed JSON.");
        } finally {
            fclose($stream);
            $zip->close();
        }

        if (! is_array($value) || array_is_list($value)) {
            throw new InvalidAccountArchive("{$entryName} must contain a JSON object.");
        }

        return $value;
    }

    /** @return Generator<int, array<string, mixed>> */
    public function rows(string $archivePath, string $entryName): Generator
    {
        $zip = $this->open($archivePath);
        $stream = $zip->getStream($entryName);

        if ($stream === false) {
            $zip->close();
            throw new InvalidAccountArchive("{$entryName} cannot be read.");
        }

        $lineNumber = 0;
        $maxLineBytes = (int) config('achelife.portability.max_ndjson_line_bytes');
        $maxEntryBytes = (int) config('achelife.portability.max_entry_bytes');
        $bytesRead = 0;

        try {
            while (($line = fgets($stream, $maxLineBytes + 1)) !== false) {
                $lineNumber++;
                $bytesRead += strlen($line);

                if ($bytesRead > $maxEntryBytes) {
                    throw new InvalidAccountArchive("{$entryName} exceeds the maximum uncompressed file size.");
                }

                if (strlen($line) > $maxLineBytes || (! str_ends_with($line, "\n") && ! feof($stream))) {
                    throw new InvalidAccountArchive("{$entryName} row {$lineNumber} is too large.");
                }

                if (trim($line) === '') {
                    throw new InvalidAccountArchive("{$entryName} row {$lineNumber} is empty.");
                }

                try {
                    $row = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
                } catch (JsonException) {
                    throw new InvalidAccountArchive("{$entryName} row {$lineNumber} contains malformed JSON.");
                }

                if (! is_array($row) || array_is_list($row)) {
                    throw new InvalidAccountArchive("{$entryName} row {$lineNumber} must be a JSON object.");
                }

                yield $lineNumber => $row;
            }
        } finally {
            fclose($stream);
            $zip->close();
        }
    }

    public function hash(string $archivePath, string $entryName): string
    {
        $zip = $this->open($archivePath);
        $stream = $zip->getStream($entryName);

        if ($stream === false) {
            $zip->close();
            throw new InvalidAccountArchive("{$entryName} cannot be read.");
        }

        $hash = hash_init('sha256');
        $bytesRead = 0;
        $maxEntryBytes = (int) config('achelife.portability.max_entry_bytes');

        try {
            while (! feof($stream)) {
                $chunk = fread($stream, 8192);

                if ($chunk === false) {
                    throw new InvalidAccountArchive("{$entryName} cannot be read.");
                }

                $bytesRead += strlen($chunk);

                if ($bytesRead > $maxEntryBytes) {
                    throw new InvalidAccountArchive("{$entryName} exceeds the maximum uncompressed file size.");
                }

                hash_update($hash, $chunk);
            }

            return hash_final($hash);
        } finally {
            fclose($stream);
            $zip->close();
        }
    }

    private function open(string $archivePath): ZipArchive
    {
        $zip = new ZipArchive;
        $result = $zip->open($archivePath, ZipArchive::RDONLY);

        if ($result !== true) {
            throw new InvalidAccountArchive('The uploaded file is not a readable ZIP archive.');
        }

        return $zip;
    }

    /** @param resource $stream */
    private function readBoundedStream($stream, string $entryName): string
    {
        $content = '';
        $maxEntryBytes = (int) config('achelife.portability.max_entry_bytes');

        while (! feof($stream)) {
            $chunk = fread($stream, 8192);

            if ($chunk === false) {
                throw new InvalidAccountArchive("{$entryName} cannot be read.");
            }

            $content .= $chunk;

            if (strlen($content) > $maxEntryBytes) {
                throw new InvalidAccountArchive("{$entryName} exceeds the maximum uncompressed file size.");
            }
        }

        return $content;
    }
}
