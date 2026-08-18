<?php

namespace Tests\Feature\Diary;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesDiaryEntries;
use Tests\TestCase;

class PeopleAndSearchTest extends TestCase
{
    use CreatesDiaryEntries, RefreshDatabase;

    public function test_structured_mention_uses_owned_person_id_and_survives_rename(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $person = $user->people()->create(['name' => 'Ahmed']);
        $content = [
            ['type' => 'text', 'text' => 'I spent the afternoon with '],
            ['type' => 'mention', 'personId' => $person->id, 'label' => 'Ahmed'],
            ['type' => 'text', 'text' => ' in the garden.'],
        ];
        $entry = $this->autosaveDiary($user, '2026-08-18', content: $content);
        $person->update(['name' => 'Ahmed El Idrissi']);

        $mention = $entry->mentions()->firstOrFail();
        $this->assertSame('I spent the afternoon with @Ahmed in the garden.', $entry->plain_text);
        $this->assertSame($person->id, $mention->person_id);
        $this->assertSame('@Ahmed', $mention->display_text);
        $this->assertSame('Ahmed El Idrissi', $mention->person->name);
    }

    public function test_http_autosave_preserves_spaces_at_structured_mention_boundaries(): void
    {
        CarbonImmutable::setTestNow('2026-08-18');
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $insayd = $user->people()->create(['name' => 'insayd']);
        $ahmed = $user->people()->create(['name' => 'ahmed']);

        $response = $this->actingAs($user)->putJson('/diary/entries/2026-08-18', [
            'content' => [
                ['type' => 'text', 'text' => 'Nothing '],
                ['type' => 'mention', 'personId' => $insayd->id, 'label' => 'insayd'],
                ['type' => 'text', 'text' => ' okey now we can go with '],
                ['type' => 'mention', 'personId' => $ahmed->id, 'label' => 'ahmed'],
            ],
            'language_code' => 'en',
            'mood' => 'peaceful',
            'mood_group' => 'calm',
            'client_revision' => 1,
        ])->assertOk();

        $response->assertJsonPath('entry.state', 'completed')
            ->assertJsonPath('entry.languageCode', 'en')
            ->assertJsonPath('entry.mood', 'peaceful')
            ->assertJsonPath('entry.streakAfter', 1)
            ->assertJsonPath('entry.multiplier', '1.0')
            ->assertJsonPath('entry.earnedSp', 4);

        $entry = $user->diaryEntries()->firstOrFail();
        $this->assertSame('Nothing @insayd okey now we can go with @ahmed', $entry->plain_text);
        $this->assertSame('Nothing ', $entry->content[0]['text']);
        $this->assertSame(' okey now we can go with ', $entry->content[2]['text']);
    }

    public function test_another_users_person_cannot_be_inserted_or_accessed(): void
    {
        $owner = $this->diaryUserCreatedOn('2026-08-01');
        $intruder = $this->diaryUserCreatedOn('2026-08-01');
        $person = $owner->people()->create(['name' => 'Ahmed']);

        $this->actingAs($intruder)->putJson('/diary/entries/2026-08-18', [
            'content' => [['type' => 'mention', 'personId' => $person->id, 'label' => 'Ahmed']],
            'language_code' => 'en', 'mood' => null, 'mood_group' => null, 'client_revision' => 1,
        ])->assertUnprocessable();
        $this->actingAs($intruder)->put("/diary/people/{$person->id}", ['name' => 'Changed'])->assertForbidden();
    }

    public function test_unmentioned_person_can_be_deleted_but_mentioned_person_must_be_archived(): void
    {
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $unmentioned = $user->people()->create(['name' => 'Yassine']);
        $this->actingAs($user)->delete("/diary/people/{$unmentioned->id}")->assertRedirect();
        $this->assertDatabaseMissing('people', ['id' => $unmentioned->id]);

        $mentioned = $user->people()->create(['name' => 'Ahmed']);
        $this->autosaveDiary($user, '2026-08-18', content: [
            ['type' => 'text', 'text' => 'A thoughtful conversation with '],
            ['type' => 'mention', 'personId' => $mentioned->id, 'label' => 'Ahmed'],
        ]);
        $this->actingAs($user)->delete("/diary/people/{$mentioned->id}")->assertSessionHasErrors('person');
        $this->actingAs($user)->post("/diary/people/{$mentioned->id}/archive")->assertRedirect();
        $this->assertNotNull($mentioned->refresh()->archived_at);
        $this->assertDatabaseHas('diary_entry_mentions', ['person_id' => $mentioned->id]);
    }

    public function test_person_profile_data_and_search_filters_are_user_scoped(): void
    {
        CarbonImmutable::setTestNow('2026-08-18');
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $other = $this->diaryUserCreatedOn('2026-08-01');
        $person = $user->people()->create(['name' => 'Ahmed', 'nickname' => 'Hmed', 'note' => 'Old friend']);
        $otherPerson = $other->people()->create(['name' => 'Private']);
        $this->autosaveDiary($user, '2026-08-18', content: [
            ['type' => 'text', 'text' => 'Peaceful garden walk with '],
            ['type' => 'mention', 'personId' => $person->id, 'label' => 'Ahmed'],
        ], language: 'fr', mood: 'peaceful', moodGroup: 'calm');
        $this->autosaveDiary($other, '2026-08-18', 'Private garden writing');
        $user->seasons()->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/diary?q=garden&mood=peaceful&language=fr&person='.$person->id)
            ->assertInertia(fn (Assert $page) => $page
                ->has('search.results', 1)
                ->where('search.results.0.date', '2026-08-18')
                ->where('people.0.mentionCount', 1)
                ->where('people.0.recentEntries.0.date', '2026-08-18'));

        $this->actingAs($user)->get('/diary?person='.$otherPerson->id)
            ->assertInertia(fn (Assert $page) => $page->has('search.results', 0));
    }

    public function test_calendar_serializes_unavailable_pending_missed_completed_and_locking_states(): void
    {
        CarbonImmutable::setTestNow('2026-08-18');
        $user = $this->diaryUserCreatedOn('2026-08-01');
        $this->autosaveDiary($user, '2026-08-17', today: '2026-08-18');
        $user->seasons()->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/diary?date=2026-08-18&month=2026-08')->assertInertia(function (Assert $page): void {
            $days = collect($page->toArray()['props']['calendar']['days'])->keyBy('date');
            $this->assertSame('completed', $days['2026-08-17']['state']);
            $this->assertSame('pending', $days['2026-08-18']['state']);
            $this->assertSame('missed', $days['2026-08-16']['state']);
            $this->assertSame('unavailable', $days['2026-08-19']['state']);
            $this->assertSame('unavailable', $days['2026-07-27']['state']);
        });
    }
}
