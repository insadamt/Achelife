<?php

namespace App\Support\Settings;

use App\Models\AppearanceSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AppearanceBackground
{
    public const MAX_BYTES = 8 * 1024 * 1024;

    private const CHUNK_BYTES = 512 * 1024;

    public function store(User $user, UploadedFile $image): void
    {
        $imagePath = $image->getRealPath();
        $bytes = $imagePath === false ? false : file_get_contents($imagePath);

        if ($bytes === false || $bytes === '') {
            throw new RuntimeException('The background image could not be read.');
        }

        if (strlen($bytes) > self::MAX_BYTES) {
            throw new RuntimeException('Choose an image smaller than 8 MB.');
        }

        $mime = $this->imageMime($bytes);

        DB::transaction(function () use ($user, $bytes, $mime): void {
            DB::table('appearance_background_chunks')->where('user_id', $user->id)->delete();

            foreach (str_split($bytes, self::CHUNK_BYTES) as $sequence => $chunk) {
                DB::table('appearance_background_chunks')->insert([
                    'user_id' => $user->id,
                    'sequence' => $sequence,
                    'base64_data' => base64_encode($chunk),
                ]);
            }

            AppearanceSetting::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'background_mime' => $mime,
                    'background_hash' => hash('sha256', $bytes),
                    'background_bytes' => strlen($bytes),
                ],
            );
        });
    }

    public function clear(User $user): void
    {
        DB::transaction(function () use ($user): void {
            DB::table('appearance_background_chunks')->where('user_id', $user->id)->delete();
            AppearanceSetting::query()->where('user_id', $user->id)->update([
                'background_mime' => null,
                'background_hash' => null,
                'background_bytes' => null,
            ]);
        });
    }

    public function bytes(User $user, AppearanceSetting $settings): ?string
    {
        if ($settings->background_hash === null) {
            return null;
        }

        $encodedChunks = DB::table('appearance_background_chunks')
            ->where('user_id', $user->id)
            ->orderBy('sequence')
            ->pluck('base64_data');
        $bytes = '';

        foreach ($encodedChunks as $encodedChunk) {
            $chunk = base64_decode($encodedChunk, true);

            if ($chunk === false) {
                return null;
            }

            $bytes .= $chunk;
        }

        if (strlen($bytes) !== $settings->background_bytes
            || ! hash_equals($settings->background_hash, hash('sha256', $bytes))) {
            return null;
        }

        return $bytes;
    }

    public function imageMime(string $bytes): string
    {
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes);

        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], true)) {
            throw new RuntimeException('Choose a JPEG, PNG, WebP, or AVIF image.');
        }

        return $mime;
    }
}
