<?php

namespace Tests\Feature\Money;

use App\Actions\Money\DeleteUnusedMoneyTag;
use App\Actions\Seasons\SynchronizeUserSeasons;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class TagLifecycleTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-12 10:00:00');
    }

    public function test_tags_can_be_created_edited_and_managed_from_organization(): void
    {
        $user = $this->moneyUser();
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);

        $this->actingAs($user)->post('/money/tags', ['name' => '  Xbox  ', 'color' => '#2563eb'])
            ->assertSessionHasNoErrors();
        $tag = $user->moneyTags()->sole();
        $this->assertSame('Xbox', $tag->name);
        $this->assertSame('#2563EB', $tag->color);

        $this->post('/money/tags', ['name' => 'xbox', 'color' => '#000000'])->assertSessionHasErrors('name');
        $this->put("/money/tags/{$tag->id}", ['name' => 'Console', 'color' => '#7C3AED'])->assertSessionHasNoErrors();

        $this->get('/money/organization?section=tags')->assertOk()->assertInertia(fn ($page) => $page
            ->component('money/organization/Index')
            ->where('initialSection', 'tags')
            ->where('tags.0.name', 'Console')
            ->where('tags.0.color', '#7C3AED')
            ->where('tags.0.archivedAt', null)
            ->where('tags.0.hasHistory', false));
    }

    public function test_used_tags_can_be_archived_without_changing_history(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $payload = ['type' => 'expense', 'amount' => '10.00', 'account_id' => $account->id, 'category_id' => $category->id, 'tags' => ['Retro'], 'date' => '2026-09-12'];
        $this->actingAs($user)->post('/money/transactions', $payload)->assertSessionHasNoErrors();
        $transaction = $user->moneyTransactions()->sole();
        $tag = $user->moneyTags()->sole();

        $this->post("/money/tags/{$tag->id}/archive")->assertSessionHasNoErrors();
        $this->post('/money/transactions', $payload)->assertSessionHasErrors('tags');
        $this->put("/money/transactions/{$transaction->id}", [...$payload, 'amount' => '11.00'])->assertSessionHasNoErrors();
        $this->assertSame([$tag->id], $transaction->refresh()->tags()->pluck('money_tags.id')->all());

        try {
            app(DeleteUnusedMoneyTag::class)->execute($tag);
            $this->fail('A used Tag must retain its historical relationship.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        $this->post("/money/tags/{$tag->id}/reactivate")->assertSessionHasNoErrors();
        $this->post('/money/transactions', $payload)->assertSessionHasNoErrors();
    }

    public function test_unused_tags_can_be_deleted_and_other_users_cannot_manage_them(): void
    {
        $owner = $this->moneyUser();
        $intruder = $this->moneyUser();
        $this->actingAs($owner)->post('/money/tags', ['name' => 'Physical', 'color' => '#059669']);
        $tag = $owner->moneyTags()->sole();

        $this->actingAs($intruder)->put("/money/tags/{$tag->id}", ['name' => 'Changed', 'color' => '#000000'])->assertForbidden();
        $this->post("/money/tags/{$tag->id}/archive")->assertForbidden();
        $this->delete("/money/tags/{$tag->id}")->assertForbidden();

        app(DeleteUnusedMoneyTag::class)->execute($tag);
        $this->assertDatabaseMissing('money_tags', ['id' => $tag->id]);
    }
}
