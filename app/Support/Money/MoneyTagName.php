<?php

namespace App\Support\Money;

use Illuminate\Support\Str;

class MoneyTagName
{
    public function display(string $name): string
    {
        return preg_replace('/\s+/u', ' ', trim($name)) ?? trim($name);
    }

    public function normalized(string $name): string
    {
        return Str::lower($this->display($name));
    }
}
