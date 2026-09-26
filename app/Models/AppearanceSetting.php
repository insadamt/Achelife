<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'surface_style', 'background_mime', 'background_hash', 'background_bytes'])]
class AppearanceSetting extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected function casts(): array
    {
        return ['background_bytes' => 'integer'];
    }
}
