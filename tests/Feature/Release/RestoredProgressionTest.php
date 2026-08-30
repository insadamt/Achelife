<?php

namespace Tests\Feature\Release;

use App\Actions\Portability\RestoreAccountArchive;
use App\Data\Portability\AccountRestoreRequest;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use App\Support\Seasons\SeasonCloseoutViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsPortableAccounts;
use Tests\TestCase;

class RestoredProgressionTest extends TestCase
{
    use BuildsPortableAccounts, RefreshDatabase;

    public function test_portable_restore_preserves_progression_totals_and_closeout_breakdown(): void
    {
        CarbonImmutable::setTestNow('2026-09-15 12:00:00');
        $source = User::factory()->create();
        $this->buildCompletePortableGraph($source);
        $archivePath = app(AccountArchiveExporter::class)->export($source);

        try {
            $target = User::factory()->create([
                'onboarding_step' => 'path',
                'onboarding_completed_at' => null,
            ]);
            $archive = app(AccountArchiveValidator::class)->validate($archivePath);
            app(RestoreAccountArchive::class)->execute(
                $target,
                $archive,
                new AccountRestoreRequest(freshInstall: true),
            );

            $closeout = app(SeasonCloseoutViewDataFactory::class)->make($target->seasons()->sole());

            $this->assertSame(106, $closeout['seasonPoints']);
            $this->assertSame([
                'tasks' => 8,
                'habits' => 4,
                'diary' => 4,
                'objectives' => 100,
                'constitution' => -10,
            ], $closeout['breakdown']);
            $this->assertSame(106, array_sum($closeout['breakdown']));
            $this->assertSame('BRONZE II', $closeout['rank']['displayName']);
            $this->assertSame(1, $target->seasons()->count());
            $this->assertSame('restore', $target->seasonIntermissions()->sole()->reason->value);
        } finally {
            @unlink($archivePath);
        }
    }
}
