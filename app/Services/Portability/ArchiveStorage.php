<?php

namespace App\Services\Portability;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ArchiveStorage
{
    public function storePending(User $user, UploadedFile $archive): string
    {
        $name = Str::uuid().'.achelife.zip';
        $stored = Storage::disk('local')->putFileAs($this->pendingDirectory($user), $archive, $name);

        if (! is_string($stored)) {
            throw new RuntimeException('Unable to store the uploaded archive for preview.');
        }

        return $stored;
    }

    public function pendingPath(User $user, string $storedPath): string
    {
        if (! str_starts_with($storedPath, $this->pendingDirectory($user).'/')) {
            throw new RuntimeException('The pending archive does not belong to this account.');
        }

        return Storage::disk('local')->path($storedPath);
    }

    public function deletePending(User $user, string $storedPath): void
    {
        if (str_starts_with($storedPath, $this->pendingDirectory($user).'/')) {
            Storage::disk('local')->delete($storedPath);
        }
    }

    public function storeSafety(User $user, string $archivePath): string
    {
        $name = 'safety-'.now('UTC')->format('Ymd-His').'-'.Str::lower(Str::random(10)).'.achelife.zip';
        $stream = fopen($archivePath, 'rb');

        if ($stream === false) {
            throw new RuntimeException('Unable to read the verified safety archive.');
        }

        try {
            $stored = Storage::disk('local')->put($this->safetyDirectory($user).'/'.$name, $stream);
        } finally {
            fclose($stream);
        }

        if (! $stored) {
            throw new RuntimeException('Unable to retain the verified safety archive.');
        }

        return $name;
    }

    public function safetyPath(User $user, string $name): string
    {
        if (basename($name) !== $name || ! str_ends_with($name, '.achelife.zip')) {
            throw new RuntimeException('The safety archive name is invalid.');
        }

        $path = $this->safetyDirectory($user).'/'.$name;

        if (! Storage::disk('local')->exists($path)) {
            throw new RuntimeException('The safety archive is no longer available.');
        }

        return Storage::disk('local')->path($path);
    }

    private function pendingDirectory(User $user): string
    {
        return "portability/pending/{$user->id}";
    }

    private function safetyDirectory(User $user): string
    {
        return "portability/safety/{$user->id}";
    }
}
