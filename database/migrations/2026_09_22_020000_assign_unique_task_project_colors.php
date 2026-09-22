<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $colorsByUser = [];

        DB::table('task_projects')->orderBy('user_id')->orderBy('id')->each(function (object $project) use (&$colorsByUser): void {
            $usedColors = $colorsByUser[$project->user_id] ?? [];
            $color = $project->color === null ? null : strtoupper($project->color);
            if ($color === null || isset($usedColors[$color])) {
                $color = $this->nextColor($usedColors);
                DB::table('task_projects')->where('id', $project->id)->update(['color' => $color]);
            }

            $usedColors[$color] = true;
            $colorsByUser[$project->user_id] = $usedColors;
        });
    }

    public function down(): void {}

    /** @param array<string, bool> $usedColors */
    private function nextColor(array $usedColors): string
    {
        for ($attempt = 1; $attempt <= 360; $attempt++) {
            $hue = fmod($attempt * 137.508, 360);
            $color = $this->hslToHex($hue, 0.64, 0.56);
            if (! isset($usedColors[$color])) {
                return $color;
            }
        }

        return '#2563EB';
    }

    private function hslToHex(float $hue, float $saturation, float $lightness): string
    {
        $chroma = (1 - abs(2 * $lightness - 1)) * $saturation;
        $secondary = $chroma * (1 - abs(fmod($hue / 60, 2) - 1));
        $channels = match (true) {
            $hue < 60 => [$chroma, $secondary, 0],
            $hue < 120 => [$secondary, $chroma, 0],
            $hue < 180 => [0, $chroma, $secondary],
            $hue < 240 => [0, $secondary, $chroma],
            $hue < 300 => [$secondary, 0, $chroma],
            default => [$chroma, 0, $secondary],
        };
        $offset = $lightness - $chroma / 2;

        return strtoupper('#'.implode('', array_map(fn (float $channel): string => str_pad(dechex((int) round(($channel + $offset) * 255)), 2, '0', STR_PAD_LEFT), $channels)));
    }
};
