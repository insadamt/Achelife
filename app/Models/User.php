<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\SeasonRolloverPreference;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'timezone', 'calendar_started_on', 'season_rollover_preference', 'hold_next_season', 'money_preset_pack_version'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            $user->timezone ??= 'UTC';
            $user->season_rollover_preference ??= SeasonRolloverPreference::Automatic;
            $user->hold_next_season ??= false;
            $user->money_preset_pack_version ??= 0;

            if ($user->calendar_started_on === null) {
                $createdAt = $user->created_at === null
                    ? CarbonImmutable::now('UTC')
                    : CarbonImmutable::parse($user->created_at, 'UTC');
                $user->calendar_started_on = $createdAt->setTimezone($user->timezone)->toDateString();
            }
        });
    }

    /** @return HasMany<Season, $this> */
    public function seasons(): HasMany
    {
        return $this->hasMany(Season::class);
    }

    /** @return HasMany<SeasonIntermission, $this> */
    public function seasonIntermissions(): HasMany
    {
        return $this->hasMany(SeasonIntermission::class);
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /** @return HasMany<TaskSeries, $this> */
    public function taskSeries(): HasMany
    {
        return $this->hasMany(TaskSeries::class);
    }

    /** @return HasMany<Habit, $this> */
    public function habits(): HasMany
    {
        return $this->hasMany(Habit::class);
    }

    /** @return HasMany<HabitOccurrence, $this> */
    public function habitOccurrences(): HasMany
    {
        return $this->hasMany(HabitOccurrence::class);
    }

    /** @return HasMany<DiaryEntry, $this> */
    public function diaryEntries(): HasMany
    {
        return $this->hasMany(DiaryEntry::class);
    }

    /** @return HasMany<Person, $this> */
    public function people(): HasMany
    {
        return $this->hasMany(Person::class);
    }

    /** @return HasMany<Law, $this> */
    public function laws(): HasMany
    {
        return $this->hasMany(Law::class);
    }

    /** @return HasMany<Violation, $this> */
    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }

    /** @return HasMany<Objective, $this> */
    public function objectives(): HasMany
    {
        return $this->hasMany(Objective::class);
    }

    /** @return HasMany<MoneyAccount, $this> */
    public function moneyAccounts(): HasMany
    {
        return $this->hasMany(MoneyAccount::class);
    }

    /** @return HasMany<MoneyCategory, $this> */
    public function moneyCategories(): HasMany
    {
        return $this->hasMany(MoneyCategory::class);
    }

    /** @return HasMany<MoneySubcategory, $this> */
    public function moneySubcategories(): HasMany
    {
        return $this->hasMany(MoneySubcategory::class);
    }

    /** @return HasMany<MoneyTransaction, $this> */
    public function moneyTransactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class);
    }

    /** @return HasOne<TodaySetting, $this> */
    public function todaySetting(): HasOne
    {
        return $this->hasOne(TodaySetting::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'calendar_started_on' => 'immutable_date',
            'season_rollover_preference' => SeasonRolloverPreference::class,
            'hold_next_season' => 'boolean',
            'money_preset_pack_version' => 'integer',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
