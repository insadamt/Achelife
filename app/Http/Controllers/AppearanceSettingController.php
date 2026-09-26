<?php

namespace App\Http\Controllers;

use App\Models\AppearanceSetting;
use App\Support\Settings\AppearanceBackground;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AppearanceSettingController extends Controller
{
    public function updateStyle(Request $request): RedirectResponse
    {
        $style = $request->validate([
            'surface_style' => ['required', Rule::in(['normal', 'glass'])],
        ])['surface_style'];

        AppearanceSetting::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['surface_style' => $style],
        );

        return back();
    }

    public function uploadBackground(Request $request, AppearanceBackground $background): RedirectResponse
    {
        $image = $request->validate([
            'background' => ['required', 'file', 'image', 'mimetypes:image/jpeg,image/png,image/webp,image/avif', 'max:8192'],
        ])['background'];

        try {
            $background->store($request->user(), $image);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['background' => $exception->getMessage()]);
        }

        return back();
    }

    public function clearBackground(Request $request, AppearanceBackground $background): RedirectResponse
    {
        $background->clear($request->user());

        return back();
    }

    public function background(Request $request, string $hash, AppearanceBackground $background): Response
    {
        $settings = AppearanceSetting::query()->find($request->user()->id);

        abort_if($settings === null || ! hash_equals((string) $settings->background_hash, $hash), 404);

        $bytes = $background->bytes($request->user(), $settings);

        abort_if($bytes === null, 404);

        return response($bytes, 200, [
            'Content-Type' => $settings->background_mime,
            'Content-Length' => (string) strlen($bytes),
            'Cache-Control' => 'private, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
