<?php

namespace App\Http\Controllers;

use App\Actions\Portability\RestoreAccountArchive;
use App\Data\Portability\AccountRestoreRequest;
use App\Exceptions\InvalidAccountArchive;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchivePreviewer;
use App\Services\Portability\AccountArchiveValidator;
use App\Services\Portability\ArchiveStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AccountPortabilityController extends Controller
{
    public function export(Request $request, AccountArchiveExporter $exporter): BinaryFileResponse
    {
        $path = $exporter->export($request->user());
        $name = 'achelife-account-'.now('UTC')->format('Y-m-d-His').'.achelife.zip';

        return response()->download($path, $name, [
            'Content-Type' => 'application/zip',
            'X-Content-Type-Options' => 'nosniff',
        ])->deleteFileAfterSend(true);
    }

    public function previewFresh(Request $request): RedirectResponse
    {
        return $this->preview($request, 'fresh');
    }

    public function previewReplacement(Request $request): RedirectResponse
    {
        return $this->preview($request, 'account');
    }

    public function restoreFresh(Request $request, RestoreAccountArchive $restore): RedirectResponse
    {
        return $this->restore($request, $restore, 'fresh', new AccountRestoreRequest(freshInstall: true));
    }

    public function restoreReplacement(Request $request, RestoreAccountArchive $restore): RedirectResponse
    {
        $validated = $request->validate([
            'confirmation' => ['required', 'string'],
        ]);

        return $this->restore($request, $restore, 'account', new AccountRestoreRequest(
            freshInstall: false,
            literalConfirmation: $validated['confirmation'],
        ));
    }

    public function welcome(Request $request): Response|RedirectResponse
    {
        $summary = $request->session()->get('portability.restore_summary');

        if (! is_array($summary)) {
            return redirect()->route('home');
        }

        return Inertia::render('portability/Welcome', ['summary' => $summary]);
    }

    public function safety(Request $request, string $name, ArchiveStorage $storage): BinaryFileResponse
    {
        try {
            $path = $storage->safetyPath($request->user(), $name);
        } catch (\RuntimeException) {
            abort(404);
        }

        return response()->download($path, $name, [
            'Content-Type' => 'application/zip',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function preview(Request $request, string $context): RedirectResponse
    {
        $maxKilobytes = (int) ceil(config('achelife.portability.max_archive_bytes') / 1024);
        $validated = $request->validate(['archive' => ['required', 'file', "max:{$maxKilobytes}"]]);
        $uploaded = $validated['archive'];

        if (! $uploaded instanceof UploadedFile) {
            throw ValidationException::withMessages(['archive' => 'Choose an Achelife archive to preview.']);
        }

        $storage = app(ArchiveStorage::class);
        $validator = app(AccountArchiveValidator::class);
        $previewer = app(AccountArchivePreviewer::class);
        $sessionKey = "portability.pending.{$context}";
        $previousPath = $request->session()->get("{$sessionKey}.stored_path");
        $storedPath = $storage->storePending($request->user(), $uploaded);

        try {
            $archive = $validator->validate($storage->pendingPath($request->user(), $storedPath));
            $preview = $previewer->preview($archive);
        } catch (InvalidAccountArchive $exception) {
            $storage->deletePending($request->user(), $storedPath);
            throw ValidationException::withMessages(['archive' => $exception->getMessage()]);
        }

        if (is_string($previousPath)) {
            $storage->deletePending($request->user(), $previousPath);
        }

        $request->session()->put($sessionKey, [
            'stored_path' => $storedPath,
            'preview' => $preview,
        ]);

        return back();
    }

    private function restore(Request $request, RestoreAccountArchive $restore, string $context, AccountRestoreRequest $restoreRequest): RedirectResponse
    {
        $storage = app(ArchiveStorage::class);
        $validator = app(AccountArchiveValidator::class);
        $sessionKey = "portability.pending.{$context}";
        $pending = $request->session()->get($sessionKey);

        if (! is_array($pending) || ! is_string($pending['stored_path'] ?? null)) {
            throw ValidationException::withMessages(['archive' => 'Upload and preview an archive before restoring it.']);
        }

        try {
            $path = $storage->pendingPath($request->user(), $pending['stored_path']);
            $archive = $validator->validate($path);
            $result = $restore->execute($request->user(), $archive, $restoreRequest);
        } catch (InvalidAccountArchive $exception) {
            throw ValidationException::withMessages(['archive' => $exception->getMessage()]);
        }

        $summary = $result->summary;

        if ($result->safetyArchiveName !== null) {
            $summary['safetyArchiveName'] = $result->safetyArchiveName;
            $summary['safetyArchiveUrl'] = route('portability.safety', $result->safetyArchiveName);
        }

        $request->session()->put('portability.restore_summary', $summary);
        $request->session()->forget($sessionKey);
        $storage->deletePending($request->user(), $pending['stored_path']);
        Auth::setUser($request->user()->refresh());

        return redirect()->route('portability.welcome');
    }
}
