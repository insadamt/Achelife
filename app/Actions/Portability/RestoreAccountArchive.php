<?php

namespace App\Actions\Portability;

use App\Data\Portability\AccountRestoreRequest;
use App\Data\Portability\RestoreResult;
use App\Data\Portability\ValidatedArchive;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchivePreviewer;
use App\Services\Portability\AccountArchiveValidator;
use App\Services\Portability\ArchiveDatabaseImporter;
use App\Services\Portability\ArchiveStorage;
use App\Services\Portability\RestoreCatchUpService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RestoreAccountArchive
{
    public function __construct(
        private readonly AccountArchiveValidator $validator,
        private readonly AccountArchivePreviewer $previewer,
        private readonly AccountArchiveExporter $exporter,
        private readonly ArchiveStorage $storage,
        private readonly ArchiveDatabaseImporter $databaseImporter,
        private readonly RestoreCatchUpService $catchUp,
    ) {}

    public function execute(User $user, ValidatedArchive $previewedArchive, AccountRestoreRequest $request): RestoreResult
    {
        $archive = $this->validator->validate($previewedArchive->path);
        $this->validateConfirmation($user, $request);
        $lock = Cache::lock($this->lockName($user), 300);

        if (! $lock->get()) {
            throw ValidationException::withMessages(['archive' => 'Another restore or account write is already in progress.']);
        }

        $safetyArchiveName = null;

        try {
            if (! $request->freshInstall) {
                $safetyArchiveName = $this->createVerifiedSafetyArchive($user);
            }

            $preview = $this->previewer->preview($archive);
            $summary = DB::transaction(function () use ($user, $archive, $preview): array {
                $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
                $latestSeason = $this->databaseImporter->replaceAccountData($lockedUser, $archive);

                return $this->catchUp->apply($lockedUser->refresh(), $latestSeason, $preview);
            }, 3);

            return new RestoreResult($summary, $safetyArchiveName);
        } finally {
            $lock->release();
        }
    }

    private function validateConfirmation(User $user, AccountRestoreRequest $request): void
    {
        if ($request->freshInstall) {
            if ($user->onboarding_completed_at !== null || $user->onboarding_step !== 'path' || $user->seasons()->exists()) {
                throw ValidationException::withMessages(['archive' => 'Fresh restore is available only before normal onboarding creates domain data.']);
            }

            return;
        }

        if ($request->literalConfirmation !== 'RESTORE') {
            throw ValidationException::withMessages([
                'confirmation' => 'Type RESTORE exactly to replace this account.',
            ]);
        }
    }

    private function createVerifiedSafetyArchive(User $user): string
    {
        $archivePath = $this->exporter->export($user);

        try {
            $this->validator->validate($archivePath);

            return $this->storage->storeSafety($user, $archivePath);
        } finally {
            @unlink($archivePath);
        }
    }

    private function lockName(User $user): string
    {
        return "achelife-account-write:{$user->id}";
    }
}
