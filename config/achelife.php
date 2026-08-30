<?php

return [
    'application_version' => env('ACHELIFE_VERSION', '1.0.0-rc.1-dev'),

    'portability' => [
        'max_archive_bytes' => 50 * 1024 * 1024,
        'max_entry_bytes' => 25 * 1024 * 1024,
        'max_uncompressed_bytes' => 200 * 1024 * 1024,
        'max_entries' => 64,
        'max_ndjson_line_bytes' => 2 * 1024 * 1024,
        'future_tolerance_minutes' => 5,
    ],
];
